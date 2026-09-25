'use client';

import { useState } from 'react';
import { FIELDS } from '@/lib/fields';
import { useAutosave } from '@/lib/useAutosave';

const EMPTY_FORM = Object.fromEntries(FIELDS.map((field) => [field.name, '']));

const SAVE_MESSAGES = {
  idle: '',
  saving: 'กำลังบันทึก…',
  saved: 'บันทึกแล้ว',
  error: 'ยังบันทึกไม่ได้ กำลังลองใหม่…',
};

export function IntakeForm() {
  const [values, setValues] = useState(EMPTY_FORM);
  const { save, status } = useAutosave();

  function handleChange(event) {
    const next = { ...values, [event.target.name]: event.target.value };
    setValues(next);
    save(next);
  }

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <h1 className="text-3xl font-bold text-slate-900">ข้อมูลส่วนตัว</h1>

      <div className="mt-8 space-y-6">
        {FIELDS.map((field) => (
          <div key={field.name} className="group">
            <label
              htmlFor={field.name}
              className="block text-lg font-semibold text-slate-900 group-focus-within:text-blue-700"
            >
              {field.label.th}
              {!field.required && (
                <span className="font-normal text-slate-600"> (ไม่บังคับ)</span>
              )}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type ?? 'text'}
              autoComplete={field.autoComplete}
              value={values[field.name]}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border-2 border-slate-500 bg-white px-4 py-3 text-lg text-slate-900 focus:border-blue-700 focus:outline-hidden focus:ring-4 focus:ring-blue-200"
            />
          </div>
        ))}
      </div>

      <p aria-live="polite" className="mt-6 min-h-6 text-sm text-slate-600">
        {SAVE_MESSAGES[status]}
      </p>
    </form>
  );
}