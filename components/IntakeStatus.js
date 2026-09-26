import { formatIdle } from '@/lib/intakeStatus';

// Blue: still filling in. Amber: gone quiet. Green: submitted, and only then.
// The words say the same thing, so colour is never the only signal.
export const STATUS_STYLES = {
  filling: { dot: 'bg-blue-600', pill: 'border-blue-200 bg-blue-50 text-blue-900', edge: 'border-t-blue-600' },
  inactive: { dot: 'bg-amber-500', pill: 'border-amber-200 bg-amber-50 text-amber-900', edge: 'border-t-amber-500' },
  submitted: { dot: 'bg-green-700', pill: 'border-green-200 bg-green-50 text-green-900', edge: 'border-t-green-700' },
};

function label(status, submittedAt) {
  if (status.kind === 'submitted') return `Submitted ${submittedAt}`;
  if (status.kind === 'inactive') return `Inactive · ${formatIdle(status.idleMs)}`;
  return 'Filling in';
}

export function IntakeStatus({ status, submittedAt }) {
  const style = STATUS_STYLES[status.kind];
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${style.pill}`}
    >
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${style.dot}`} />
      {label(status, submittedAt)}
    </p>
  );
}
