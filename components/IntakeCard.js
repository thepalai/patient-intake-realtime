import { useState } from 'react';
import { IntakeStatus, ProgressStrip } from '@/components/IntakeStatus';
import { FIELDS, REVIEW_STEP, STEPS } from '@/lib/fields';
import { ageInYears, displayAnswer } from '@/lib/intakeRow';
import {
  OPENED_FOR_MS,
  SUBMITTED_OPEN_MS,
  intakeStatus,
  submittedFor,
} from '@/lib/intakeStatus';

const timeOnly = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const dayAndTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

// "Started 21:08" is unclear once a card is from another day, so times from
// other days show the date too.
function clockTime(iso) {
  const time = new Date(iso);
  const isToday = time.toDateString() === new Date().toDateString();
  return (isToday ? timeOnly : dayAndTime).format(time);
}

// What staff read for one field: codes become English words, and a birth
// date also shows the age.
function answerText(field, intake) {
  const text = displayAnswer(field, intake, 'en');
  if (text && field.kind === 'date') {
    return `${text} (age ${ageInYears(intake[field.name])})`;
  }
  return text;
}

// `now` is the page's clock, so the status moves on by itself when a
// patient stops typing, and a submitted card closes up by itself.
export function IntakeCard({ intake, now }) {
  const name = [intake.first_name, intake.middle_name, intake.last_name]
    .filter(Boolean)
    .join(' ');
  const status = intakeStatus(intake, now);
  const answersId = `answers-${intake.id}`;

  // A submitted card shows only its header once it is 2 minutes old. Opening
  // it records when, and it stays open for 2 minutes from then.
  const [openedAt, setOpenedAt] = useState(null);
  const canClose = status.kind === 'submitted' && submittedFor(intake, now) >= SUBMITTED_OPEN_MS;
  const open = !canClose || (openedAt !== null && now - openedAt < OPENED_FOR_MS);

  // The card fades in where it appears, unless the device asks for less motion.
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white motion-safe:animate-fade-in">
      <ProgressStrip status={status} step={intake.current_step} />
      <div className="p-5">
        {/* Name on the left, status on the right, like the page header with
            its Live badge. A long name wraps; the status keeps its size. */}
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold break-words text-slate-900">
              {name || 'New patient'}
            </h3>
            <p className="text-sm text-slate-600">
              Started <time dateTime={intake.created_at}>{clockTime(intake.created_at)}</time>
            </p>
          </div>
          <div className="shrink-0">
            <IntakeStatus
              status={status}
              submittedAt={intake.submitted_at && clockTime(intake.submitted_at)}
            />
            {status.kind !== 'submitted' && (
              <p className="sr-only">
                Step {intake.current_step} of {REVIEW_STEP}
              </p>
            )}
          </div>
        </header>

        {canClose && (
          <button
            type="button"
            onClick={() => setOpenedAt(open ? null : now)}
            aria-expanded={open}
            aria-controls={answersId}
            className="mt-3 rounded text-sm font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden"
          >
            {open ? 'Hide answers' : 'Show answers'}
          </button>
        )}

        {/* Every field, grouped by the step the patient fills it in. A thicker
            line marks each group instead of a heading, which keeps cards short
            on a busy screen; the label still names the group for screen readers. */}
        <div id={answersId} hidden={!open}>
          {STEPS.map((step) => (
            <section key={step.id} aria-label={step.title.en} className="mt-3 border-t-2 border-slate-200">
              <dl className="divide-y divide-slate-100">
                {FIELDS.filter((field) => field.step === step.id).map((field) => (
                  <div key={field.name} className="grid grid-cols-[8rem_1fr] gap-3 py-1.5">
                    <dt className="text-sm text-slate-600">{field.label.en}</dt>
                    <dd className="min-w-0 text-sm break-words whitespace-pre-line text-slate-900">
                      {answerText(field, intake) ?? <NotAnswered />}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

function NotAnswered() {
  return (
    <>
      <span aria-hidden="true" className="text-slate-400">
        —
      </span>
      <span className="sr-only">Not answered yet</span>
    </>
  );
}
