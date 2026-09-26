import { useEffect, useRef } from 'react';

// Long enough to read the message, short enough that the next person on a
// shared tablet never sees the previous patient's screen.
const CLEAR_AFTER_MS = 30_000;

const TEXT = {
  title: { th: 'ส่งข้อมูลเรียบร้อยแล้ว', en: 'Your details have been sent' },
  wait: { th: 'กรุณารอเจ้าหน้าที่เรียกชื่อ', en: 'Please wait for a member of staff to call your name.' },
  clears: {
    th: 'หน้านี้จะล้างข้อมูลเพื่อคนถัดไปใน 30 วินาที',
    en: 'This screen clears for the next person in 30 seconds.',
  },
  again: { th: 'เริ่มใหม่สำหรับคนถัดไป', en: 'Start again for the next person' },
};

export function ThankYou({ lang, onRestart }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
    const timer = setTimeout(onRestart, CLEAR_AFTER_MS);
    return () => clearTimeout(timer);
  }, [onRestart]);

  return (
    <div>
      {/* Green is kept for "submitted" only, here and on the staff view. */}
      <div className="rounded-2xl bg-green-700 px-6 py-8 text-center text-white">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold focus:outline-hidden">
          {TEXT.title[lang]}
        </h1>
        <p className="mt-3 text-xl">{TEXT.wait[lang]}</p>
      </div>
      <p className="mt-6 text-slate-700">{TEXT.clears[lang]}</p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-6 w-full rounded-xl border-2 border-blue-700 px-6 py-4 text-lg font-semibold text-blue-700 hover:bg-blue-50 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden sm:w-auto"
      >
        {TEXT.again[lang]}
      </button>
    </div>
  );
}
