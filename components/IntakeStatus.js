import { REVIEW_STEP } from '@/lib/fields';
import { statusLabel } from '@/lib/intakeStatus';

// Blue: still filling in. Amber: gone quiet. Green: submitted, and only then.
// The words say the same thing, so colour is never the only signal.
export const STATUS_STYLES = {
  filling: { dot: 'bg-blue-600', pill: 'border-blue-200 bg-blue-50 text-blue-900', fill: 'bg-blue-600' },
  inactive: { dot: 'bg-amber-500', pill: 'border-amber-200 bg-amber-50 text-amber-900', fill: 'bg-amber-500' },
  submitted: { dot: 'bg-green-700', pill: 'border-green-200 bg-green-50 text-green-900', fill: 'bg-green-700' },
};

export function IntakeStatus({ status, submittedAt }) {
  const style = STATUS_STYLES[status.kind];
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${style.pill}`}
    >
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${style.dot}`} />
      {statusLabel(status, submittedAt)}
    </p>
  );
}

// The strip along the top of a card: one segment per step, filled in the
// status colour up to the step the patient is on, all four once submitted.
export function ProgressStrip({ status, step }) {
  const filled = status.kind === 'submitted' ? REVIEW_STEP : step;
  return (
    <div aria-hidden="true" className="flex gap-1">
      {Array.from({ length: REVIEW_STEP }, (_, index) => (
        <div
          key={index}
          className={`h-1.5 flex-1 ${index < filled ? STATUS_STYLES[status.kind].fill : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
}
