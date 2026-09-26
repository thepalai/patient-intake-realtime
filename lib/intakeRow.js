import { FIELDS } from '@/lib/fields';

// A Buddhist Era year is the Common Era year plus 543 (พ.ศ. 2533 = ค.ศ. 1990).
const BUDDHIST_ERA_OFFSET = 543;
const OLDEST_AGE = 120;

// Does this choice open a text box when "other" is picked?
export function hasOtherBox(field) {
  return field.options?.some((option) => option.other) ?? false;
}

// The form keeps one value per input, exactly as typed. A date has three
// inputs, and a choice with an "other" option has a text box as well.
export function emptyAnswers() {
  const answers = {};
  for (const field of FIELDS) {
    if (field.kind === 'date') {
      answers[`${field.name}_day`] = '';
      answers[`${field.name}_month`] = '';
      answers[`${field.name}_year`] = '';
    } else {
      answers[field.name] = field.defaultValue ?? '';
    }
    if (hasOtherBox(field)) {
      answers[`${field.name}_other`] = '';
    }
  }
  return answers;
}

// The three date boxes as a real date, or null if they don't make one.
// Thai patients type the year in the Buddhist Era.
export function dateFromParts(answers, name, lang) {
  const day = answers[`${name}_day`].trim();
  const month = answers[`${name}_month`].trim();
  const year = answers[`${name}_year`].trim();
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) {
    return null;
  }
  const commonEraYear = Number(year) - (lang === 'th' ? BUDDHIST_ERA_OFFSET : 0);
  const date = new Date(Date.UTC(commonEraYear, Number(month) - 1, Number(day)));
  // Date.UTC rolls 31 February over into March, so check that nothing moved.
  const unchanged =
    date.getUTCFullYear() === commonEraYear &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day);
  return unchanged ? date : null;
}

export function isFutureDate(date) {
  return date > new Date();
}

export function isTooLongAgo(date) {
  return ageInYears(date) > OLDEST_AGE;
}

// Whole years from a birth date (a Date or 'YYYY-MM-DD') to today.
export function ageInYears(birth) {
  const born = typeof birth === 'string' ? new Date(`${birth}T00:00:00Z`) : birth;
  const today = new Date();
  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < born.getUTCMonth() ||
    (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() < born.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

// When the patient switches language, a typed birth year moves to the other
// calendar, so the date itself stays the same (2533 in Thai is 1990 in
// English). The preferred language follows the screen language until the
// patient picks one themselves.
export function withLanguage(answers, fromLang, toLang) {
  if (fromLang === toLang) return answers;
  const next = { ...answers };
  for (const field of FIELDS.filter((candidate) => candidate.kind === 'date')) {
    const year = answers[`${field.name}_year`].trim();
    if (/^\d{4}$/.test(year)) {
      const shift = toLang === 'th' ? BUDDHIST_ERA_OFFSET : -BUDDHIST_ERA_OFFSET;
      next[`${field.name}_year`] = String(Number(year) + shift);
    }
  }
  if (answers.preferred_language === fromLang) {
    next.preferred_language = toLang;
  }
  return next;
}

// Blank answers are saved as null, never as ''. This is the one place that
// turns what was typed into what is saved.
function clean(text) {
  const trimmed = text.trim();
  return trimmed === '' ? null : trimmed;
}

function storedValue(field, answers, lang) {
  if (field.kind === 'date') {
    // Save a date only once it is a real, possible one, so staff never see
    // half a date or a year typed in the wrong calendar.
    const date = dateFromParts(answers, field.name, lang);
    if (!date || isFutureDate(date) || isTooLongAgo(date)) return null;
    return date.toISOString().slice(0, 10);
  }
  const value = answers[field.name];
  if (hasOtherBox(field) && value === 'other') {
    // "other" shows as Other until the patient types what it is.
    return clean(answers[`${field.name}_other`]) ?? 'other';
  }
  return clean(value);
}

// The database row for these answers. `current_step` tells staff which step
// the patient is on.
export function toRow(answers, step, lang) {
  const row = { current_step: step };
  for (const field of FIELDS) {
    row[field.name] = storedValue(field, answers, lang);
  }
  return row;
}

// How one saved answer reads to a person, in their language. Codes become
// words, and dates read as dates (Thai dates in the Buddhist Era).
export function displayAnswer(field, row, lang) {
  const value = row[field.name];
  // Rows saved before blanks became null hold '' instead; both mean "not answered".
  if (value == null || value === '') return null;
  if (field.kind === 'date') {
    return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00Z`));
  }
  const option = field.options?.find((choice) => choice.value === value);
  return option ? option.label[lang] : value;
}
