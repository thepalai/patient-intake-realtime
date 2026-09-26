// The first screen of the form. Nobody has chosen a language yet, so this is
// the one place that speaks both; after this the form uses only the one chosen.
export function LanguagePage({ headingRef, onChoose }) {
  const buttonClasses =
    'block w-full rounded-xl border-2 border-blue-700 bg-white px-6 py-5 text-left text-2xl font-semibold text-blue-800 hover:bg-blue-50 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden';
  return (
    <div>
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold text-slate-900 focus:outline-hidden">
        เลือกภาษา
        <span lang="en" className="mt-1 block text-xl font-normal text-slate-600">
          Choose your language
        </span>
      </h1>
      <div className="mt-8 space-y-4">
        <button type="button" lang="th" onClick={() => onChoose('th')} className={buttonClasses}>
          ไทย
        </button>
        <button type="button" lang="en" onClick={() => onChoose('en')} className={buttonClasses}>
          English
        </button>
      </div>
      <p className="mt-6 text-slate-600">
        เปลี่ยนภาษาได้ตลอดจากปุ่มมุมขวาบน{' '}
        <span lang="en">You can switch at any time from the top right.</span>
      </p>
    </div>
  );
}
