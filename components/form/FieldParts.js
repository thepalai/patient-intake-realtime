// Pieces shared by every kind of field, following the GOV.UK Design System:
// the label, then the hint, then the error, then the input.

const OPTIONAL = { th: ' (ไม่บังคับ)', en: ' (optional)' };
const ERROR_PREFIX = { th: 'ข้อผิดพลาด: ', en: 'Error: ' };

export function OptionalTag({ lang }) {
  return <span className="font-normal text-slate-600">{OPTIONAL[lang]}</span>;
}

export function Hint({ id, children }) {
  return (
    <p id={id} className="mt-1 text-slate-600">
      {children}
    </p>
  );
}

export function ErrorMessage({ id, lang, children }) {
  return (
    <p id={id} className="mt-1 font-semibold text-red-700">
      <span className="sr-only">{ERROR_PREFIX[lang]}</span>
      {children}
    </p>
  );
}

// A red bar down the left marks the field that needs fixing.
export function fieldClasses(error) {
  return error ? 'group border-l-4 border-red-700 pl-4' : 'group';
}

export function controlClasses(error) {
  const border = error
    ? 'border-red-700 focus:border-red-700'
    : 'border-slate-500 focus:border-blue-700';
  return `mt-2 block w-full rounded-lg border-2 bg-white px-4 py-3 text-lg text-slate-900 focus:ring-4 focus:ring-blue-200 focus:outline-hidden ${border}`;
}

// The ids a screen reader should read after the label: the hint, then the error.
export function describedBy(...ids) {
  const present = ids.filter(Boolean);
  return present.length > 0 ? present.join(' ') : undefined;
}
