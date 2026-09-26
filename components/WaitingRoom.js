'use client';

import { IntakeCard } from '@/components/IntakeCard';
import { LogoMark } from '@/components/LogoMark';
import { LiveBadge } from '@/components/LiveBadge';
import {
  SUBMITTED_IN_VIEW_MS,
  SUBMITTED_OPEN_MS,
  isSetAside,
  isShown,
  submittedFor,
} from '@/lib/intakeStatus';
import { useLiveIntakes } from '@/lib/useLiveIntakes';
import { useNow } from '@/lib/useNow';

// Groups in the order staff act on them: patients still filling in (they may
// need help), patients who submitted in the last hour (ready to be called, in
// the order they finished), then two folded groups: submissions older than an
// hour, and cards gone quiet for over 10 minutes.
function groupIntakes(intakes, now) {
  const shown = intakes.filter((intake) => isShown(intake, now));
  const submitted = shown
    .filter((intake) => intake.submitted_at)
    .sort((a, b) => Date.parse(a.submitted_at) - Date.parse(b.submitted_at));
  const recent = submitted.filter((intake) => submittedFor(intake, now) < SUBMITTED_IN_VIEW_MS);
  return {
    inProgress: shown.filter((intake) => !intake.submitted_at && !isSetAside(intake, now)),
    // Closed-up cards and just-submitted, open ones sit in separate grids: in
    // one grid, a short card next to a tall one leaves a gap below it on a
    // wide screen. The split is by time, not by whether a card is open, so a
    // card staff open by hand stays where it is.
    submittedClosed: recent.filter((intake) => submittedFor(intake, now) >= SUBMITTED_OPEN_MS),
    submittedJustNow: recent.filter((intake) => submittedFor(intake, now) < SUBMITTED_OPEN_MS),
    submittedEarlier: submitted.filter((intake) => submittedFor(intake, now) >= SUBMITTED_IN_VIEW_MS),
    setAside: shown.filter((intake) => isSetAside(intake, now)),
  };
}

export function WaitingRoom() {
  const { intakes, connection, loaded, error } = useLiveIntakes();
  const now = useNow(); // ticks every second, so statuses update without new data
  const groups = groupIntakes(intakes, now);

  return (
    <main lang="en" className="flex-1 bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-blue-800">
              <LogoMark className="size-5" />
              OPD Check-in
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Waiting room</h1>
            {loaded && (
              <p className="text-sm text-slate-600">
                {groups.inProgress.length} in progress ·{' '}
                {groups.submittedClosed.length +
                  groups.submittedJustNow.length +
                  groups.submittedEarlier.length}{' '}
                submitted
              </p>
            )}
          </div>
          <LiveBadge connection={connection} />
        </div>
      </header>

      {/* No maximum width: a large monitor in the waiting area fits more cards. */}
      <div className="px-4 py-6 sm:px-8">
        <IntakeList groups={groups} loaded={loaded} error={error} now={now} />
      </div>
    </main>
  );
}

// Early returns keep one state per line: error, then loading, then empty.
// Once patients have loaded, a failed reload keeps the cards on screen.
function IntakeList({ groups, loaded, error, now }) {
  const { inProgress, submittedClosed, submittedJustNow, submittedEarlier, setAside } = groups;
  if (!loaded && error) {
    return (
      <Notice
        title="Couldn't load patients"
        body="Check the internet connection. The page keeps trying by itself."
      />
    );
  }
  if (!loaded) {
    return <Notice title="Loading patients…" />;
  }
  const total =
    inProgress.length + submittedClosed.length + submittedJustNow.length + submittedEarlier.length + setAside.length;
  if (total === 0) {
    return (
      <Notice
        title="No patients yet"
        body="When a patient starts the form, their card appears here. You don't need to refresh."
      />
    );
  }
  return (
    <div className="space-y-10">
      <Section title="In progress" grids={[inProgress]} now={now} empty="No one is filling in the form right now." />
      {/* Oldest first, so the closed-up cards come before the newest, open ones. */}
      <Section
        title="Submitted in the last hour"
        grids={[submittedClosed, submittedJustNow]}
        now={now}
        empty="Submitted forms appear here, first to finish first."
      />
      <Folded
        title="Submitted over an hour ago"
        intakes={submittedEarlier}
        now={now}
        note="Earlier submissions from the last 24 hours, first to finish first."
      />
      <Folded
        title="Inactive for over 10 minutes"
        intakes={setAside}
        now={now}
        note="These patients may have left the form. A card returns to the queue as soon as its patient types again."
      />
    </div>
  );
}

// Folded away at the bottom; a native <details> opens and closes without any
// state of ours, so it stays open while the clock re-renders the page.
function Folded({ title, intakes, now, note }) {
  if (intakes.length === 0) return null;
  return (
    <details className="border-t border-slate-200 pt-6">
      <summary className="cursor-pointer rounded text-lg font-semibold text-slate-700 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden">
        {title} ({intakes.length})
      </summary>
      <p className="mt-2 mb-6 text-sm text-slate-600">{note}</p>
      <CardGrid intakes={intakes} now={now} />
    </details>
  );
}

// A heading with a count, so staff can tell at a glance how many patients are
// at each stage. A section can hold more than one grid, one after another.
function Section({ title, grids, now, empty }) {
  const headingId = `${title.toLowerCase().replace(/\s+/g, '-')}-heading`;
  const count = grids.reduce((sum, intakes) => sum + intakes.length, 0);
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-4 text-lg font-semibold text-slate-700">
        {title} ({count})
      </h2>
      {count > 0 ? (
        <div className="space-y-6">
          {/* Each grid keeps its place in the list as its key, so a card
              staff opened keeps its state when another grid empties. */}
          {grids.map(
            (intakes, index) => intakes.length > 0 && <CardGrid key={index} intakes={intakes} now={now} />,
          )}
        </div>
      ) : (
        <p className="text-slate-600">{empty}</p>
      )}
    </section>
  );
}

// One column on a phone, up to five on a 1920px monitor. The last breakpoint
// is in rem (120rem = 1920px) like the built-in ones, so Tailwind orders it
// after them and it wins on a wide screen.
function CardGrid({ intakes, now }) {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[120rem]:grid-cols-5">
      {intakes.map((intake) => (
        <li key={intake.id}>
          <IntakeCard intake={intake} now={now} />
        </li>
      ))}
    </ul>
  );
}

function Notice({ title, body }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {body && <p className="mt-2 text-slate-600">{body}</p>}
    </div>
  );
}
