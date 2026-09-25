import { FIELDS } from '@/lib/fields';

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
});

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
          Started{' '}
          <time dateTime={intake.created_at}>
            {timeFormat.format(new Date(intake.created_at))}
          </time>
        </p>
      </header>

      <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
        {FIELDS.map((field) => (
          <div key={field.name} className="grid grid-cols-[8rem_1fr] gap-3 py-2">
            <dt className="text-sm text-slate-600">{field.label.en}</dt>
            <dd className="min-w-0 text-sm break-words text-slate-900">
              {intake[field.name] || <NotAnswered />}
            </dd>
          </div>
        ))}
      </dl>
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
