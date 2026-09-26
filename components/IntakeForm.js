'use client';

import { useCallback, useRef, useState } from 'react';
import { REVIEW_STEP, STEPS } from '@/lib/fields';
import { emptyAnswers, toRow } from '@/lib/intakeRow';
import { useAutosave } from '@/lib/useAutosave';
import { validateStep } from '@/lib/validation';
import { Review } from '@/components/form/Review';
import { StepFields } from '@/components/form/StepFields';
import { ThankYou } from '@/components/form/ThankYou';

const TEXT = {
  stepOf: {
    th: (step, total) => `ขั้นที่ ${step} จาก ${total}`,
    en: (step, total) => `Step ${step} of ${total}`,
  },
  reviewTitle: { th: 'ตรวจสอบข้อมูล', en: 'Check your answers' },
  back: { th: 'ย้อนกลับ', en: 'Back' },
  next: { th: 'ถัดไป', en: 'Continue' },
};

const SAVE_MESSAGES = {
  idle: { th: '', en: '' },
  saving: { th: 'กำลังบันทึก…', en: 'Saving…' },
  saved: { th: 'บันทึกแล้ว', en: 'Saved' },
  error: { th: 'ยังบันทึกไม่ได้ กำลังลองใหม่…', en: "Couldn't save yet. Trying again…" },
};

// Focus moves after the next render, so a screen reader announces the new
// step, or the field that needs fixing.
function focusHeading(headingRef) {
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  });
}

function focusField(id) {
  requestAnimationFrame(() => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ block: 'center' });
    element?.focus({ preventScroll: true });
  });
}

export function IntakeForm() {
  // A new key starts a new session: empty answers and a new row id, ready
  // for the next patient.
  const [session, setSession] = useState(0);
  const restart = useCallback(() => setSession((current) => current + 1), []);
  return <IntakeSession key={session} onRestart={restart} />;
}

function IntakeSession({ onRestart }) {
  const lang = 'th'; // Thai only for now; the language picker will set this.
  const [answers, setAnswers] = useState(emptyAnswers);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState('filling'); // filling | sending | sent
  const [sendFailed, setSendFailed] = useState(false);
  const { save, submit, status } = useAutosave();
  const headingRef = useRef(null);

  // Every keystroke goes to autosave. Editing a field clears its error.
  function handleChange(name, value, errorKeys) {
    const next = { ...answers, [name]: value };
    setAnswers(next);
    setErrors((current) => {
      const remaining = { ...current };
      for (const key of errorKeys) delete remaining[key];
      return remaining;
    });
    save(toRow(next, step, lang));
  }

  function showStep(nextStep) {
    setStep(nextStep);
    setErrors({});
    save(toRow(answers, nextStep, lang)); // staff see which step the patient is on
    focusHeading(headingRef);
  }

  // Each input's first box has the error key as its id, so focus can go there.
  function showErrors(stepErrors) {
    setErrors(stepErrors);
    focusField(Object.keys(stepErrors)[0]);
  }

  function handleNext(event) {
    event.preventDefault();
    const stepErrors = validateStep(step, answers, lang);
    if (Object.keys(stepErrors).length > 0) {
      showErrors(stepErrors);
      return;
    }
    showStep(step + 1);
  }

  async function handleSend() {
    // Each step was checked on the way here; check them all once more.
    for (const { id } of STEPS) {
      const stepErrors = validateStep(id, answers, lang);
      if (Object.keys(stepErrors).length > 0) {
        setStep(id);
        showErrors(stepErrors);
        return;
      }
    }
    setPhase('sending');
    setSendFailed(false);
    const { ok } = await submit(toRow(answers, REVIEW_STEP, lang));
    if (ok) {
      setPhase('sent');
    } else {
      setPhase('filling');
      setSendFailed(true);
    }
  }

  if (phase === 'sent') {
    return <ThankYou lang={lang} onRestart={onRestart} />;
  }

  const isReview = step === REVIEW_STEP;
  const title = isReview ? TEXT.reviewTitle[lang] : STEPS[step - 1].title[lang];

  return (
    <div>
      {step > 1 && (
        <button
          type="button"
          onClick={() => showStep(step - 1)}
          className="mb-6 rounded text-lg text-blue-700 underline underline-offset-4 hover:text-blue-900 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden"
        >
          ‹ {TEXT.back[lang]}
        </button>
      )}
      <p className="text-slate-600">{TEXT.stepOf[lang](step, REVIEW_STEP)}</p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-1 text-3xl font-bold text-slate-900 focus:outline-hidden">
        {title}
      </h1>

      <div className="mt-6">
        {isReview ? (
          <Review
            row={toRow(answers, REVIEW_STEP, lang)}
            lang={lang}
            onChangeStep={showStep}
            onSend={handleSend}
            sending={phase === 'sending'}
            sendFailed={sendFailed}
          />
        ) : (
          // noValidate: our messages replace the browser's own pop-ups.
          <form noValidate onSubmit={handleNext}>
            <StepFields step={step} answers={answers} errors={errors} lang={lang} onChange={handleChange} />
            <button
              type="submit"
              className="mt-10 w-full rounded-xl bg-blue-700 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden sm:w-auto"
            >
              {TEXT.next[lang]}
            </button>
          </form>
        )}
      </div>

      <p aria-live="polite" className="mt-6 min-h-6 text-sm text-slate-600">
        {SAVE_MESSAGES[status][lang]}
      </p>
    </div>
  );
}
