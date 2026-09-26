import { FIELDS, STEPS } from '@/lib/fields';
import { displayAnswer } from '@/lib/intakeRow';

const TEXT = {
  intro: {
    th: 'ตรวจข้อมูลก่อนส่ง ถ้าต้องการแก้ แตะ "แก้ไข" ของหัวข้อนั้น',
    en: 'Check your answers before sending. To change one, select "Change" next to its section.',
  },
  change: { th: 'แก้ไข', en: 'Change' },
  notGiven: { th: 'ไม่ได้กรอก', en: 'Not given' },
  send: { th: 'ยืนยันและส่งข้อมูล', en: 'Confirm and send' },
  sending: { th: 'กำลังส่ง…', en: 'Sending…' },
  sendFailed: {
    th: 'ส่งข้อมูลไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต แล้วกดส่งอีกครั้ง',
    en: "Your answers weren't sent. Check the internet connection and try again.",
  },
};

// The GOV.UK "check your answers" pattern: every answer, grouped by step,
// read back from the same row that is saved, so it matches what staff see.
export function Review({ row, lang, onChangeStep, onSend, sending, sendFailed }) {
  return (
    <div className="space-y-8">
      <p className="text-lg text-slate-700">{TEXT.intro[lang]}</p>

      {STEPS.map((step) => (
        <section key={step.id} aria-labelledby={`review-${step.id}`}>
          <div className="flex items-baseline justify-between gap-4 border-b-2 border-slate-900 pb-2">
            <h2 id={`review-${step.id}`} className="text-xl font-bold text-slate-900">
              {step.title[lang]}
            </h2>
            <button
              type="button"
              onClick={() => onChangeStep(step.id)}
              className="rounded text-lg text-blue-700 underline underline-offset-4 hover:text-blue-900 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden"
            >
              {TEXT.change[lang]}
              <span className="sr-only"> {step.title[lang]}</span>
            </button>
          </div>
          <dl className="divide-y divide-slate-200">
            {FIELDS.filter((field) => field.step === step.id).map((field) => (
              <div key={field.name} className="py-3 sm:grid sm:grid-cols-[12rem_1fr] sm:gap-4">
                <dt className="font-semibold text-slate-900">{field.label[lang]}</dt>
                <dd className="min-w-0 break-words whitespace-pre-line text-slate-900">
                  {displayAnswer(field, row, lang) ?? (
                    <span className="text-slate-600">{TEXT.notGiven[lang]}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {sendFailed && (
        <p role="alert" className="border-l-4 border-red-700 pl-4 font-semibold text-red-700">
          {TEXT.sendFailed[lang]}
        </p>
      )}

      <button
        type="button"
        onClick={onSend}
        disabled={sending}
        className="w-full rounded-xl bg-blue-700 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden disabled:bg-slate-400 sm:w-auto"
      >
        {sending ? TEXT.sending[lang] : TEXT.send[lang]}
      </button>
    </div>
  );
}
