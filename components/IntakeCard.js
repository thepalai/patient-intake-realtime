import { IntakeStatus, STATUS_STYLES } from '@/components/IntakeStatus';
import { FIELDS, STEPS } from '@/lib/fields';
import { ageInYears, displayAnswer } from '@/lib/intakeRow';
import { intakeStatus } from '@/lib/intakeStatus';

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
// patient stops typing.
export function IntakeCard({ intake, now }) {
  const name = [intake.first_name, intake.middle_name, intake.last_name]
    .filter(Boolean)
    .join(' ');
  const status = intakeStatus(intake, now);

  return (
    <article
      className={`rounded-2xl border border-t-4 border-slate-200 bg-white p-5 ${STATUS_STYLES[status.kind].edge}`}
    >
      {/* Name on the left, status on the right, like the page header with
          its Live badge. A long name wraps; the status keeps its size. */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold break-words text-slate-900">
            {name || 'New patient'}
          </h2>
          <p className="text-sm text-slate-600">
            Started <time dateTime={intake.created_at}>{clockTime(intake.created_at)}</time>
          </p>
        </div>
        <div className="shrink-0">
          <IntakeStatus
            status={status}
            submittedAt={intake.submitted_at && clockTime(intake.submitted_at)}
          />
        </div>
      </header>

      {/* Every field, grouped by the step the patient fills it in. */}
      {STEPS.map((step) => (
        <section key={step.id} aria-label={step.title.en} className="mt-4">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {step.title.en}
          </h3>
          <dl className="mt-1 divide-y divide-slate-100 border-t border-slate-100">
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
