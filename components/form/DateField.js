import { ErrorMessage, Hint, OptionalTag, describedBy, fieldClasses } from './FieldParts';

// Three boxes, as in the GOV.UK date input: day, month and year are quick to
// type, whereas a date picker means scrolling back decades on a phone.
// The day box's id is the field's name, so an error can move focus to it.
const PARTS = [
  { part: 'day', label: { th: 'วัน', en: 'Day' }, width: 'w-20', maxLength: 2 },
  { part: 'month', label: { th: 'เดือน', en: 'Month' }, width: 'w-20', maxLength: 2 },
  { part: 'year', label: { th: 'ปี (พ.ศ.)', en: 'Year' }, width: 'w-28', maxLength: 4 },
];

// A saved birthday would fill in a Common Era year, but the Thai form asks
// for a Buddhist Era year, so the year box is left out of autofill there.
function autoCompleteFor(part, lang) {
  if (part === 'year') return lang === 'th' ? 'off' : 'bday-year';
  return `bday-${part}`;
}

export function DateField({ field, answers, error, lang, onChange }) {
  const hintId = field.hint ? `${field.name}-hint` : undefined;
  const errorId = error ? `${field.name}-error` : undefined;

  return (
    <fieldset className={fieldClasses(error)} aria-describedby={describedBy(hintId, errorId)}>
      <legend className="text-lg font-semibold text-slate-900">
        {field.label[lang]}
        {!field.required && <OptionalTag lang={lang} />}
      </legend>
      {field.hint && <Hint id={hintId}>{field.hint[lang]}</Hint>}
      {error && (
        <ErrorMessage id={errorId} lang={lang}>
          {error}
        </ErrorMessage>
      )}

      <div className="mt-2 flex flex-wrap gap-4">
        {PARTS.map(({ part, label, width, maxLength }) => {
          const name = `${field.name}_${part}`;
          const id = part === 'day' ? field.name : name;
          return (
            <div key={part}>
              <label htmlFor={id} className="block text-slate-700">
                {label[lang]}
              </label>
              <input
                id={id}
                name={name}
                inputMode="numeric"
                maxLength={maxLength}
                autoComplete={autoCompleteFor(part, lang)}
                value={answers[name]}
                onChange={(event) => onChange(name, event.target.value, [field.name])}
                aria-invalid={error ? true : undefined}
                className={`mt-1 block rounded-lg border-2 bg-white px-3 py-3 text-lg text-slate-900 focus:ring-4 focus:ring-blue-200 focus:outline-hidden ${width} ${
                  error ? 'border-red-700 focus:border-red-700' : 'border-slate-500 focus:border-blue-700'
                }`}
              />
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
