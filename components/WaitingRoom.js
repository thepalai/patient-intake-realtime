'use client';

import { IntakeCard } from '@/components/IntakeCard';
import { LiveBadge } from '@/components/LiveBadge';
import { isSetAside, isShown } from '@/lib/intakeStatus';
import { useLiveIntakes } from '@/lib/useLiveIntakes';
import { useNow } from '@/lib/useNow';

// Three groups, in the order staff act on them: patients still filling in
// (they may need help), patients who have submitted (ready to be called, in
// the order they finished), and cards gone quiet for over 10 minutes.
function groupIntakes(intakes, now) {
  const shown = intakes.filter((intake) => isShown(intake, now));
  return {
    inProgress: shown.filter((intake) => !intake.submitted_at && !isSetAside(intake, now)),
    submitted: shown
      .filter((intake) => intake.submitted_at)
      .sort((a, b) => Date.parse(a.submitted_at) - Date.parse(b.submitted_at)),
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
            <h1 className="text-2xl font-bold text-slate-900">Waiting room</h1>
            {loaded && (
              <p className="text-sm text-slate-600">
                {groups.inProgress.length} in progress · {groups.submitted.length} submitted
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
  const { inProgress, submitted, setAside } = groups;
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
  if (inProgress.length + submitted.length + setAside.length === 0) {
    return (
      <Notice
        title="No patients yet"
        body="When a patient starts the form, their card appears here. You don't need to refresh."
      />
    );
  }
  return (
    <div className="space-y-10">
      <Section title="In progress" intakes={inProgress} now={now} empty="No one is filling in the form right now." />
      <Section
        title="Submitted"
        intakes={submitted}
        now={now}
        empty="Submitted forms appear here, first to finish first."
      />

      {/* Folded away at the bottom; a native <details> opens and closes without any state of ours. */}
      {setAside.length > 0 && (
        <details className="border-t border-slate-200 pt-6">
          <summary className="cursor-pointer rounded text-lg font-semibold text-slate-700 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden">
            Inactive for over 10 minutes ({setAside.length})
          </summary>
          <p className="mt-2 mb-6 text-sm text-slate-600">
            These patients may have left the form. A card returns to the queue as soon as its patient
            types again.
          </p>
          <CardGrid intakes={setAside} now={now} />
        </details>
      )}
    </div>
  );
}

// A heading with a count, so staff can tell at a glance how many patients are
// at each stage.
function Section({ title, intakes, now, empty }) {
  const headingId = `${title.toLowerCase().replace(/\s+/g, '-')}-heading`;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-4 text-lg font-semibold text-slate-700">
        {title} ({intakes.length})
      </h2>
      {intakes.length > 0 ? (
        <CardGrid intakes={intakes} now={now} />
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
