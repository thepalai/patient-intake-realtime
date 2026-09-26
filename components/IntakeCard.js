import { FIELDS, STEPS } from '@/lib/fields';
import { ageInYears, displayAnswer } from '@/lib/intakeRow';

const timeOnly = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const dayAndTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

// "Started 21:08" is unclear once a card is from another day, so older
// cards show the date too.
function startedAt(iso) {
  const started = new Date(iso);
  const isToday = started.toDateString() === new Date().toDateString();
  return (isToday ? timeOnly : dayAndTime).format(started);
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

export function IntakeCard({ intake }) {
  const name = [intake.first_name, intake.middle_name, intake.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <header>
        <h2 className="text-lg font-semibold break-words text-slate-900">
          {name || 'New patient'}
        </h2>
        <p className="text-sm text-slate-600">
          Started <time dateTime={intake.created_at}>{startedAt(intake.created_at)}</time>
        </p>
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
