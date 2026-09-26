import { ErrorMessage, Hint, OptionalTag, controlClasses, describedBy, fieldClasses } from './FieldParts';

// One box to type in (or a dropdown). Its id is the field's name, so an
// error can move focus straight to it.
export function InputField({ field, value, error, lang, onChange }) {
  const hintId = field.hint ? `${field.name}-hint` : undefined;
  const errorId = error ? `${field.name}-error` : undefined;

  const shared = {
    id: field.name,
    name: field.name,
    value,
    onChange: (event) => onChange(field.name, event.target.value, [field.name]),
    'aria-describedby': describedBy(hintId, errorId),
    'aria-invalid': error ? true : undefined,
    className: controlClasses(error),
  };

  let control;
  if (field.kind === 'textarea') {
    control = <textarea {...shared} rows={4} maxLength={field.maxLength} autoComplete={field.autoComplete} />;
  } else if (field.kind === 'select') {
    control = (
      <select {...shared}>
        {field.options.map((option) => (
          <option key={option.value} value={option.value} lang={option.native ? option.value : undefined}>
            {option.native ?? option.label[lang]}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        {...shared}
        type={field.kind}
        maxLength={field.maxLength}
        autoComplete={field.autoComplete}
        autoCapitalize={field.kind === 'email' ? 'none' : undefined}
        spellCheck={false}
      />
    );
  }

  return (
    <div className={fieldClasses(error)}>
      <label
        htmlFor={field.name}
        className="block text-lg font-semibold text-slate-900 group-focus-within:text-blue-700"
      >
        {field.label[lang]}
        {!field.required && <OptionalTag lang={lang} />}
      </label>
      {field.hint && <Hint id={hintId}>{field.hint[lang]}</Hint>}
      {error && (
        <ErrorMessage id={errorId} lang={lang}>
          {error}
        </ErrorMessage>
      )}
      {control}
    </div>
  );
}
