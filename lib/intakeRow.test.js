import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIELDS } from '@/lib/fields';
import {
  ageInYears,
  dateFromParts,
  displayAnswer,
  emptyAnswers,
  isFutureDate,
  isTooLongAgo,
  toRow,
  withLanguage,
} from '@/lib/intakeRow';

// Birth dates are judged against today, and these functions read the clock
// themselves, so every test here runs on the same day: 26 September 2026,
// at noon UTC (19:00 in Thailand).
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

// A blank form with only the date of birth typed in, box by box.
function withBirthDate(day, month, year) {
  return answersWith({
    date_of_birth_day: day,
    date_of_birth_month: month,
    date_of_birth_year: year,
  });
}

// A field's definition from lib/fields.js, found by name.
function field(name) {
  return FIELDS.find((candidate) => candidate.name === name);
}

describe('emptyAnswers', () => {
  it('has a blank value for every input, including the date boxes and "other" boxes', () => {
    expect(emptyAnswers()).toMatchObject({
      first_name: '',
      date_of_birth_day: '',
      date_of_birth_month: '',
      date_of_birth_year: '',
      nationality_other: '',
      religion_other: '',
    });
  });

  it('starts the preferred language at Thai', () => {
    expect(emptyAnswers().preferred_language).toBe('th');
  });
});

describe('dateFromParts', () => {
  it('reads the year as Buddhist Era on the Thai form and Common Era on the English one', () => {
    const march15 = new Date('1990-03-15T00:00:00Z');
    expect(dateFromParts(withBirthDate('15', '3', '2533'), 'date_of_birth', 'th')).toEqual(march15);
    expect(dateFromParts(withBirthDate('15', '3', '1990'), 'date_of_birth', 'en')).toEqual(march15);
  });

  it('returns null for a date that does not exist', () => {
    expect(dateFromParts(withBirthDate('31', '2', '2533'), 'date_of_birth', 'th')).toBeNull();
  });

  it('accepts 29 February only in a leap year', () => {
    expect(dateFromParts(withBirthDate('29', '2', '2024'), 'date_of_birth', 'en')).not.toBeNull();
    expect(dateFromParts(withBirthDate('29', '2', '2023'), 'date_of_birth', 'en')).toBeNull();
  });

  it('returns null while a box is empty or the year is half typed', () => {
    expect(dateFromParts(withBirthDate('', '3', '2533'), 'date_of_birth', 'th')).toBeNull();
    expect(dateFromParts(withBirthDate('15', '3', '25'), 'date_of_birth', 'th')).toBeNull();
  });
});

describe('isFutureDate and isTooLongAgo', () => {
  it('counts today as a possible birth date, but not tomorrow', () => {
    expect(isFutureDate(new Date('2026-09-26T00:00:00Z'))).toBe(false);
    expect(isFutureDate(new Date('2026-09-27T00:00:00Z'))).toBe(true);
  });

  it('allows ages up to 120', () => {
    expect(isTooLongAgo(new Date('1906-09-26T00:00:00Z'))).toBe(false);
    expect(isTooLongAgo(new Date('1905-09-26T00:00:00Z'))).toBe(true);
  });
});

describe('ageInYears', () => {
  it('adds the year on the birthday itself, not before', () => {
    expect(ageInYears('1990-09-26')).toBe(36);
    expect(ageInYears('1990-09-27')).toBe(35);
  });

  it('takes a Date as well as a saved YYYY-MM-DD string', () => {
    expect(ageInYears(new Date('1990-09-26T00:00:00Z'))).toBe(36);
  });
});

describe('withLanguage', () => {
  it('moves a typed birth year to the other calendar, so the date stays the same', () => {
    const english = withLanguage(withBirthDate('15', '3', '2533'), 'th', 'en');
    expect(english.date_of_birth_year).toBe('1990');
    expect(withLanguage(english, 'en', 'th').date_of_birth_year).toBe('2533');
  });

  it('leaves a half-typed year as it is', () => {
    expect(withLanguage(withBirthDate('15', '3', '25'), 'th', 'en').date_of_birth_year).toBe('25');
  });

  it('lets the preferred language follow the screen until the patient picks one', () => {
    expect(withLanguage(emptyAnswers(), 'th', 'en').preferred_language).toBe('en');
    const picked = answersWith({ preferred_language: 'ja' });
    expect(withLanguage(picked, 'th', 'en').preferred_language).toBe('ja');
  });

  it('returns new answers and leaves the old ones untouched', () => {
    const thai = withBirthDate('15', '3', '2533');
    withLanguage(thai, 'th', 'en');
    expect(thai.date_of_birth_year).toBe('2533');
  });
});

describe('toRow', () => {
  it('sends the database columns and nothing else', () => {
    const row = toRow(emptyAnswers(), 1, 'th');
    expect(Object.keys(row)).toEqual(['current_step', ...FIELDS.map(({ name }) => name)]);
  });

  it('records the step the patient is on', () => {
    expect(toRow(emptyAnswers(), 3, 'th').current_step).toBe(3);
  });

  it('trims answers and saves blanks as null', () => {
    const row = toRow(answersWith({ first_name: '  สมชาย ', middle_name: '   ' }), 1, 'th');
    expect(row.first_name).toBe('สมชาย');
    expect(row.middle_name).toBeNull();
  });

  it('saves a birth date as YYYY-MM-DD in the Common Era', () => {
    expect(toRow(withBirthDate('15', '3', '2533'), 2, 'th').date_of_birth).toBe('1990-03-15');
  });

  it('saves no birth date until it is a real, possible one', () => {
    // Half typed.
    expect(toRow(withBirthDate('15', '3', '25'), 2, 'th').date_of_birth).toBeNull();
    // 2570 in the Buddhist Era is 2027: in the future.
    expect(toRow(withBirthDate('1', '1', '2570'), 2, 'th').date_of_birth).toBeNull();
    // 1990 typed on the Thai form reads as 1447: too long ago.
    expect(toRow(withBirthDate('15', '3', '1990'), 2, 'th').date_of_birth).toBeNull();
  });

  it('saves a choice as its code, and "other" as what the patient typed', () => {
    const answers = answersWith({
      gender: 'female',
      nationality: 'other',
      nationality_other: 'Lao',
    });
    const row = toRow(answers, 2, 'en');
    expect(row.gender).toBe('female');
    expect(row.nationality).toBe('Lao');
  });

  it('saves "other" until the patient types what it is', () => {
    expect(toRow(answersWith({ nationality: 'other' }), 2, 'en').nationality).toBe('other');
  });
});

describe('displayAnswer', () => {
  it("shows a saved code as words in the reader's language", () => {
    expect(displayAnswer(field('gender'), { gender: 'female' }, 'en')).toBe('Female');
    expect(displayAnswer(field('gender'), { gender: 'female' }, 'th')).toBe('หญิง');
  });

  it('shows typed text as it is', () => {
    expect(displayAnswer(field('nationality'), { nationality: 'Lao' }, 'en')).toBe('Lao');
  });

  it('writes dates out, with Thai dates in the Buddhist Era', () => {
    const row = { date_of_birth: '1990-03-15' };
    expect(displayAnswer(field('date_of_birth'), row, 'en')).toBe('15 March 1990');
    expect(displayAnswer(field('date_of_birth'), row, 'th')).toBe('15 มีนาคม 2533');
  });

  it('treats null and an empty string both as not answered', () => {
    expect(displayAnswer(field('middle_name'), { middle_name: null }, 'en')).toBeNull();
    expect(displayAnswer(field('middle_name'), { middle_name: '' }, 'en')).toBeNull();
  });
});
