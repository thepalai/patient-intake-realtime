import { FIELDS, GROUPS, STEPS } from '@/lib/fields';
import { DateField } from './DateField';
import { InputField } from './InputField';
import { RadioField } from './RadioField';
import { Hint, OptionalTag } from './FieldParts';

// The fields of one step, in the order lib/fields.js lists them. Fields that
// share a group (the emergency contact) sit together under one heading.
export function StepFields({ step, answers, errors, lang, onChange }) {
  const { intro } = STEPS.find((candidate) => candidate.id === step);
  const fields = FIELDS.filter((field) => field.step === step);
  const ungrouped = fields.filter((field) => !field.group);
  const groupNames = [...new Set(fields.filter((field) => field.group).map((field) => field.group))];

  const renderField = (field) => (
    <FieldByKind
      key={field.name}
      field={field}
      answers={answers}
      errors={errors}
      lang={lang}
      onChange={onChange}
    />
  );

  return (
    <div className="space-y-8">
      {intro && <p className="text-lg text-slate-700">{intro[lang]}</p>}
      {ungrouped.map(renderField)}

      {groupNames.map((groupName) => {
        const group = GROUPS[groupName];
        const members = fields.filter((field) => field.group === groupName);
        const allOptional = members.every((field) => !field.required);
        return (
          <section
            key={groupName}
            aria-labelledby={`${groupName}-heading`}
            className="space-y-6 border-t border-slate-200 pt-8"
          >
            <div>
              <h2 id={`${groupName}-heading`} className="text-xl font-bold text-slate-900">
                {group.title[lang]}
                {allOptional && <OptionalTag lang={lang} />}
              </h2>
              {group.hint && <Hint>{group.hint[lang]}</Hint>}
            </div>
            {members.map(renderField)}
          </section>
        );
      })}
    </div>
  );
}

function FieldByKind({ field, answers, errors, lang, onChange }) {
  if (field.kind === 'date') {
    return (
      <DateField field={field} answers={answers} error={errors[field.name]} lang={lang} onChange={onChange} />
    );
  }
  if (field.kind === 'radio') {
    return <RadioField field={field} answers={answers} errors={errors} lang={lang} onChange={onChange} />;
  }
  return (
    <InputField
      field={field}
      value={answers[field.name]}
      error={errors[field.name]}
      lang={lang}
      onChange={onChange}
    />
  );
}
