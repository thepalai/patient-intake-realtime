'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { REVIEW_STEP, STEPS } from '@/lib/fields';
import { emptyAnswers, toRow, withLanguage } from '@/lib/intakeRow';
import { useAutosave } from '@/lib/useAutosave';
import { validateStep } from '@/lib/validation';
import { LanguagePage } from '@/components/form/LanguagePage';
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

// Step 0 is the language page, before the four steps of the form.
const LANGUAGE_STEP = 0;

// The switch names the other language in that language, so a patient who
// can't read the current one still finds theirs.
const OTHER_LANGUAGE = {
  th: { code: 'en', name: 'English' },
  en: { code: 'th', name: 'ไทย' },
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
  const [lang, setLang] = useState('th');
  const [answers, setAnswers] = useState(emptyAnswers);
  const [step, setStep] = useState(LANGUAGE_STEP);
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState('filling'); // filling | sending | sent
  const [sendFailed, setSendFailed] = useState(false);
  const { save, submit, status } = useAutosave();
  const headingRef = useRef(null);
  const furthestStepRef = useRef(LANGUAGE_STEP); // the furthest step this patient has reached

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

  // The answers and language default to the current ones; choosing a
  // language passes in the new ones, which state won't hold until next render.
  function showStep(nextStep, nextAnswers = answers, nextLang = lang) {
    setStep(nextStep);
    setErrors({});
    // Staff see which step the patient is on. The language page isn't a step
    // of the form, so going back to it saves nothing.
    if (nextStep !== LANGUAGE_STEP) save(toRow(nextAnswers, nextStep, nextLang));
    focusHeading(headingRef);
  }

  // Each step is its own browser history entry, so the phone's back gesture
  // goes to the previous step instead of leaving the form. Moving on, or
  // jumping from the review page to change a section, adds an entry.
  function goToStep(nextStep, nextAnswers, nextLang) {
    furthestStepRef.current = Math.max(furthestStepRef.current, nextStep);
    window.history.pushState({ intakeStep: nextStep }, '');
    showStep(nextStep, nextAnswers, nextLang);
  }

  // Choosing a language starts the form, and its first save creates the row,
  // so staff see a new card as soon as someone begins.
  function chooseLanguage(code) {
    const next = withLanguage(answers, lang, code);
    setLang(code);
    setAnswers(next);
    goToStep(1, next, code);
  }

  // Switching mid-form keeps every answer. Errors already on screen are
  // worked out again, so they read in the new language.
  function switchLanguage() {
    const nextLang = OTHER_LANGUAGE[lang].code;
    const next = withLanguage(answers, lang, nextLang);
    setLang(nextLang);
    setAnswers(next);
    if (Object.keys(errors).length > 0) setErrors(validateStep(step, next, nextLang));
    save(toRow(next, step, nextLang));
  }

  // Back and forward, from the browser or from our own Back button. An effect
  // event always sees the latest answers, so the step it saves never carries
  // the empty answers of the first render (a stale closure).
  const onHistoryMove = useEffectEvent((event) => {
    const target = event.state?.intakeStep ?? LANGUAGE_STEP;
    // Entries left by the previous patient can't skip past this patient's progress.
    showStep(Math.min(target, furthestStepRef.current));
  });

  useEffect(() => {
    // A new session starts at the language page on whichever entry the
    // browser is on (after a reload, or for the next patient). Keeping the rest
    // of the state leaves Next.js's own router details intact.
    window.history.replaceState({ ...window.history.state, intakeStep: LANGUAGE_STEP }, '');
    window.addEventListener('popstate', onHistoryMove);
    return () => window.removeEventListener('popstate', onHistoryMove);
  }, []);

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
    goToStep(step + 1);
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
    return (
      <div lang={lang}>
        <ThankYou lang={lang} onRestart={onRestart} />
      </div>
    );
  }

  if (step === LANGUAGE_STEP) {
    return <LanguagePage headingRef={headingRef} onChoose={chooseLanguage} />;
  }

  const isReview = step === REVIEW_STEP;
  const title = isReview ? TEXT.reviewTitle[lang] : STEPS[step - 1].title[lang];
  const other = OTHER_LANGUAGE[lang];

  // `lang` on the wrapper tells screen readers and the browser which language
  // the form is in; the page itself is marked Thai.
  return (
    <div lang={lang}>
      <div className="mb-6 flex items-center justify-between gap-4">
        {step > 1 && (
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded text-lg text-blue-700 underline underline-offset-4 hover:text-blue-900 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden"
          >
            ‹ {TEXT.back[lang]}
          </button>
        )}
        <button
          type="button"
          lang={other.code}
          onClick={switchLanguage}
          className="ml-auto inline-flex items-center gap-2 rounded-full border-2 border-slate-300 px-4 py-2 font-semibold text-slate-800 hover:border-blue-700 hover:text-blue-800 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-hidden"
        >
          <GlobeIcon />
          {other.name}
        </button>
      </div>
      <p className="text-slate-600">{TEXT.stepOf[lang](step, REVIEW_STEP)}</p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-1 text-3xl font-bold text-slate-900 focus:outline-hidden">
        {title}
      </h1>

      <div className="mt-6">
        {isReview ? (
          <Review
            row={toRow(answers, REVIEW_STEP, lang)}
            lang={lang}
            onChangeStep={goToStep}
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

function GlobeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9z" />
    </svg>
  );
}
