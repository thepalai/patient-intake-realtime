import { ErrorMessage, Hint, OptionalTag, controlClasses, describedBy, fieldClasses } from './FieldParts';

// A set of choices. Each choice is a large, bordered row, so the whole row is
// easy to tap on a phone. The first choice's id is the field's name, so an
// error can move focus to it.
export function RadioField({ field, answers, errors, lang, onChange }) {
  const value = answers[field.name];
  const error = errors[field.name];
  const otherKey = `${field.name}_other`;
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

      <div className="mt-3 space-y-3">
        {field.options.map((option, index) => {
          const id = index === 0 ? field.name : `${field.name}-${option.value}`;
          const checked = value === option.value;
          return (
            <div key={option.value}>
              <label
                htmlFor={id}
                className="flex cursor-pointer items-center gap-4 rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 has-checked:border-blue-700 has-checked:bg-blue-50 has-focus-visible:ring-4 has-focus-visible:ring-blue-200"
              >
                <input
                  id={id}
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={checked}
                  onChange={() => onChange(field.name, option.value, [field.name, otherKey])}
                  className="size-6 shrink-0 accent-blue-700 focus:outline-hidden"
                />
                {option.label[lang]}
              </label>

              {/* "Other" opens a text box for the answer itself (GOV.UK conditional reveal). */}
              {option.other && checked && (
                <OtherBox
                  id={otherKey}
                  label={option.other.label[lang]}
                  maxLength={option.other.maxLength}
                  value={answers[otherKey]}
                  error={errors[otherKey]}
                  lang={lang}
                  onChange={(text) => onChange(otherKey, text, [otherKey])}
                />
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function OtherBox({ id, label, maxLength, value, error, lang, onChange }) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="mt-3 ml-3 border-l-4 border-slate-300 pl-6">
      <label htmlFor={id} className="block text-lg font-semibold text-slate-900">
        {label}
      </label>
      {error && (
        <ErrorMessage id={errorId} lang={lang}>
          {error}
        </ErrorMessage>
      )}
      <input
        id={id}
        name={id}
        type="text"
        value={value}
        maxLength={maxLength}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        className={controlClasses(error)}
      />
    </div>
  );
}
