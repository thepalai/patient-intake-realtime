import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyAnswers } from '@/lib/intakeRow';
import { validateStep } from '@/lib/validation';

// A birth date can't be in the future or over 120 years ago, which depends on
// today, so every test here runs on the same day: 26 September 2026.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-26T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

// A blank form with some answers typed in.
function answersWith(changes) {
  return { ...emptyAnswers(), ...changes };
}

// Each step with every required answer given, as typed on the English form
// (so the year is in the Common Era). A test changes one thing, so any error
// comes from that change. The data is made up.
const STEP_1 = { first_name: 'สมชาย', last_name: 'ใจดี', phone_number: '081 234 5678' };
const STEP_2 = {
  date_of_birth_day: '15',
  date_of_birth_month: '3',
  date_of_birth_year: '1990',
  gender: 'female',
  nationality: 'thai',
};
const STEP_3 = { address: '1 Test Road, Bangkok 10110' };

describe('required answers', () => {
  it('lists every missing answer, in the order the fields appear', () => {
    const errors = validateStep(1, emptyAnswers(), 'en');
    expect(errors).toEqual({
      first_name: 'Enter your first name',
      last_name: 'Enter your last name',
      phone_number: 'Enter your phone number',
    });
    // The form moves focus to the first error, so the order matters too.
    expect(Object.keys(errors)).toEqual(['first_name', 'last_name', 'phone_number']);
  });

  it("writes each message in the patient's language", () => {
    expect(validateStep(1, emptyAnswers(), 'th')).toEqual({
      first_name: 'กรอกชื่อ',
      last_name: 'กรอกนามสกุล',
      phone_number: 'กรอกเบอร์โทรศัพท์',
    });
  });

  it('asks the patient to select a choice and to enter everything else', () => {
    expect(validateStep(2, emptyAnswers(), 'en')).toEqual({
      date_of_birth: 'Enter your date of birth',
      gender: 'Select your gender',
      nationality: 'Select your nationality',
    });
  });

  it('needs only the address on the last step', () => {
    expect(validateStep(3, emptyAnswers(), 'en')).toEqual({ address: 'Enter your address' });
  });

  it('passes each step once its required answers are in', () => {
    expect(validateStep(1, answersWith(STEP_1), 'en')).toEqual({});
    expect(validateStep(2, answersWith(STEP_2), 'en')).toEqual({});
    expect(validateStep(3, answersWith(STEP_3), 'en')).toEqual({});
  });
});

describe('names', () => {
  it.each([
    'ณัฐวุฒิ', // Thai, with vowel and tone marks
    'Anne-Marie',
    "O'Brien",
    'O’Brien', // the curly apostrophe that iPhones type
    'Nguyễn Thị Minh',
    '王秀英',
    'Мария',
  ])('accepts %s', (name) => {
    expect(validateStep(1, answersWith({ ...STEP_1, first_name: name }), 'en')).toEqual({});
  });

  it('rejects numbers and symbols', () => {
    const errors = validateStep(1, answersWith({ ...STEP_1, first_name: 'Somchai2' }), 'en');
    expect(errors).toEqual({
      first_name:
        'First name can only include letters, spaces, hyphens, apostrophes and full stops',
    });
  });

  it('needs at least one letter', () => {
    const errors = validateStep(1, answersWith({ ...STEP_1, last_name: '-' }), 'th');
    expect(errors).toEqual({ last_name: 'นามสกุลต้องมีตัวอักษรอย่างน้อย 1 ตัว' });
  });

  it('checks an optional name only once something is typed', () => {
    expect(validateStep(1, answersWith({ ...STEP_1, middle_name: '' }), 'en')).toEqual({});
    expect(validateStep(1, answersWith({ ...STEP_1, middle_name: '2' }), 'en')).toHaveProperty(
      'middle_name',
    );
  });
});

describe('phone numbers', () => {
  it.each(['081 234 5678', '0812345678', '02 123 4567', '+66 81 234 5678', '+44 7400 123456'])(
    'accepts %s',
    (phone) => {
      expect(validateStep(1, answersWith({ ...STEP_1, phone_number: phone }), 'en')).toEqual({});
    },
  );

  it('rejects a number that is too short', () => {
    const errors = validateStep(1, answersWith({ ...STEP_1, phone_number: '081 234' }), 'en');
    expect(errors).toEqual({
      phone_number: 'Enter a phone number like 081 234 5678 or +44 7400 123456',
    });
  });

  it('reads a number without + as Thai, so a foreign one needs its country code', () => {
    const errors = validateStep(1, answersWith({ ...STEP_1, phone_number: '7400 123456' }), 'en');
    expect(errors).toHaveProperty('phone_number');
  });

  it("checks the emergency contact's phone the same way, once typed", () => {
    const wrong = answersWith({ ...STEP_3, emergency_contact_phone: '12' });
    const right = answersWith({ ...STEP_3, emergency_contact_phone: '+44 7400 123456' });
    expect(validateStep(3, wrong, 'en')).toHaveProperty('emergency_contact_phone');
    expect(validateStep(3, right, 'en')).toEqual({});
  });
});

describe('email', () => {
  it('is optional', () => {
    expect(validateStep(3, answersWith(STEP_3), 'en')).toEqual({});
  });

  it('must look like an email address once typed', () => {
    expect(validateStep(3, answersWith({ ...STEP_3, email: 'name@example' }), 'en')).toEqual({
      email: 'Enter an email address like name@example.com',
    });
    expect(validateStep(3, answersWith({ ...STEP_3, email: 'name@example.com' }), 'en')).toEqual(
      {},
    );
  });
});

describe('date of birth', () => {
  function birthDateError(day, month, year, lang) {
    const answers = answersWith({
      date_of_birth_day: day,
      date_of_birth_month: month,
      date_of_birth_year: year,
    });
    return validateStep(2, answers, lang).date_of_birth;
  }

  // One case for each of the six messages, on the Thai form.
  it.each([
    { typed: 'nothing', date: ['', '', ''], message: 'กรอกวันเกิด' },
    { typed: 'no month', date: ['15', '', '2533'], message: 'วันเกิดต้องมีวัน เดือน และปี' },
    { typed: 'a two-digit year', date: ['15', '3', '33'], message: 'ปีต้องมี 4 หลัก เช่น 2533' },
    {
      typed: '31 February',
      date: ['31', '2', '2533'],
      message: 'วันเกิดต้องเป็นวันที่ที่มีอยู่จริง',
    },
    { typed: 'a future date', date: ['1', '1', '2570'], message: 'วันเกิดต้องไม่อยู่ในอนาคต' },
    {
      typed: 'a Common Era year',
      date: ['15', '3', '1990'],
      message: 'ใส่ปีเกิดเป็น พ.ศ. เช่น 2533',
    },
  ])('$typed → $message', ({ date, message }) => {
    expect(birthDateError(...date, 'th')).toBe(message);
  });

  it('accepts a real past date in either calendar', () => {
    expect(birthDateError('15', '3', '2533', 'th')).toBeUndefined();
    expect(birthDateError('15', '3', '1990', 'en')).toBeUndefined();
  });

  it('asks the English form for a year within the last 120 years', () => {
    expect(birthDateError('15', '3', '1890', 'en')).toBe(
      'Enter a year of birth within the last 120 years',
    );
  });
});

describe('"other" answers', () => {
  it('asks for the text once "other" is picked, pointing at the text box', () => {
    const errors = validateStep(2, answersWith({ ...STEP_2, nationality: 'other' }), 'en');
    expect(errors).toEqual({ nationality_other: 'Enter your nationality' });
  });

  it('checks the text with the same rules as a name', () => {
    const answers = answersWith({ ...STEP_2, nationality: 'other', nationality_other: 'Lao1' });
    expect(validateStep(2, answers, 'en')).toEqual({
      nationality_other:
        'Nationality can only include letters, spaces, hyphens, apostrophes and full stops',
    });
  });

  it('needs the text even on an optional question, once "other" is picked', () => {
    const errors = validateStep(2, answersWith({ ...STEP_2, religion: 'other' }), 'en');
    expect(errors).toEqual({ religion_other: 'Enter your religion' });
  });

  it('passes once the text is filled in', () => {
    const answers = answersWith({ ...STEP_2, nationality: 'other', nationality_other: 'Lao' });
    expect(validateStep(2, answers, 'en')).toEqual({});
  });
});
