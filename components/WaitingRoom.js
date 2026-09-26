'use client';

import { IntakeCard } from '@/components/IntakeCard';
import { LiveBadge } from '@/components/LiveBadge';
import { useLiveIntakes } from '@/lib/useLiveIntakes';
import { useNow } from '@/lib/useNow';

export function WaitingRoom() {
  const { intakes, connection, loaded, error } = useLiveIntakes();
  const now = useNow(); // ticks every second, so statuses update without new data

  return (
    <main lang="en" className="flex-1 bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Waiting room</h1>
            {loaded && (
              <p className="text-sm text-slate-600">
                {intakes.length === 1 ? '1 patient' : `${intakes.length} patients`}
              </p>
            )}
          </div>
          <LiveBadge connection={connection} />
        </div>
      </header>

      {/* No maximum width: a large monitor in the waiting area fits more cards. */}
      <div className="px-4 py-6 sm:px-8">
        <IntakeList intakes={intakes} loaded={loaded} error={error} now={now} />
      </div>
    </main>
  );
}

// Early returns keep one state per line: error, then loading, then empty.
// Once patients have loaded, a failed reload keeps the cards on screen.
function IntakeList({ intakes, loaded, error, now }) {
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
  if (intakes.length === 0) {
    return (
      <Notice
        title="No patients yet"
        body="When a patient starts the form, their card appears here. You don't need to refresh."
      />
    );
  }
  return (
    // One column on a phone, up to five on a 1920px monitor. The last
    // breakpoint is in rem (120rem = 1920px) like the built-in ones, so
    // Tailwind orders it after them and it wins on a wide screen.
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
