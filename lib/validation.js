import { isValidPhoneNumber } from 'libphonenumber-js/min';
import { FIELDS } from '@/lib/fields';
import { dateFromParts, hasOtherBox, isFutureDate, isTooLongAgo } from '@/lib/intakeRow';

// Letters of any language (including Thai vowel and tone marks), spaces,
// hyphens, full stops and apostrophes: straight, and the curly one that
// iPhones type in its place.
const NAME_CHARACTERS = /^[\p{L}\p{M} '’.-]+$/u;
const HAS_LETTER = /\p{L}/u;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Each message says what went wrong and how to fix it.
const MESSAGES = {
  enter: {
    th: (label) => `กรอก${label}`,
    en: (label) => `Enter your ${label.toLowerCase()}`,
  },
  choose: {
    th: (label) => `เลือก${label}`,
    en: (label) => `Select your ${label.toLowerCase()}`,
  },
  nameCharacters: {
    th: (label) => `${label}ต้องไม่มีตัวเลขหรือสัญลักษณ์ ใช้ได้เฉพาะตัวอักษร เว้นวรรค และ - ' .`,
    en: (label) => `${label} can only include letters, spaces, hyphens, apostrophes and full stops`,
  },
  nameLetter: {
    th: (label) => `${label}ต้องมีตัวอักษรอย่างน้อย 1 ตัว`,
    en: (label) => `${label} must include at least one letter`,
  },
  phone: {
    th: () => 'ใส่เบอร์โทรศัพท์ให้ถูกต้อง เช่น 081 234 5678 หรือ +44 7400 123456',
    en: () => 'Enter a phone number like 081 234 5678 or +44 7400 123456',
  },
  email: {
    th: () => 'ใส่อีเมลให้ถูกต้อง เช่น name@example.com',
    en: () => 'Enter an email address like name@example.com',
  },
  dateIncomplete: {
    th: () => 'วันเกิดต้องมีวัน เดือน และปี',
    en: () => 'Date of birth must include a day, month and year',
  },
  dateYearDigits: {
    th: () => 'ปีต้องมี 4 หลัก เช่น 2533',
    en: () => 'Year must include 4 numbers',
  },
  dateReal: {
    th: () => 'วันเกิดต้องเป็นวันที่ที่มีอยู่จริง',
    en: () => 'Date of birth must be a real date',
  },
  dateFuture: {
    th: () => 'วันเกิดต้องไม่อยู่ในอนาคต',
    en: () => 'Date of birth must be in the past',
  },
  // In the Thai form, a year this far back is almost always a Common Era
  // year typed where a Buddhist Era year belongs.
  dateTooLongAgo: {
    th: () => 'ใส่ปีเกิดเป็น พ.ศ. เช่น 2533',
    en: () => 'Enter a year of birth within the last 120 years',
  },
};

function message(key, lang, label) {
  return MESSAGES[key][lang](label);
}

function checkName(text, label, lang) {
  if (!NAME_CHARACTERS.test(text)) return message('nameCharacters', lang, label);
  if (!HAS_LETTER.test(text)) return message('nameLetter', lang, label);
  return null;
}

function checkDate(field, answers, lang) {
  const parts = ['day', 'month', 'year'].map((part) => answers[`${field.name}_${part}`].trim());
  const filled = parts.filter(Boolean).length;
  if (filled === 0) return field.required ? message('enter', lang, field.label[lang]) : null;
  if (filled < 3) return message('dateIncomplete', lang);
  if (!/^\d{4}$/.test(parts[2])) return message('dateYearDigits', lang);
  const date = dateFromParts(answers, field.name, lang);
  if (!date) return message('dateReal', lang);
  if (isFutureDate(date)) return message('dateFuture', lang);
  if (isTooLongAgo(date)) return message('dateTooLongAgo', lang);
  return null;
}

// Errors for one field, keyed like the inputs: `nationality` for the choice
// and `nationality_other` for its text box.
function checkField(field, answers, lang) {
  const label = field.label[lang];
  if (field.kind === 'date') {
    const error = checkDate(field, answers, lang);
    return error ? { [field.name]: error } : {};
  }

  const value = answers[field.name].trim();
  if (value === '') {
    if (!field.required) return {};
    const key = field.kind === 'radio' || field.kind === 'select' ? 'choose' : 'enter';
    return { [field.name]: message(key, lang, label) };
  }

  if (hasOtherBox(field) && value === 'other') {
    const otherKey = `${field.name}_other`;
    const other = answers[otherKey].trim();
    if (other === '') return { [otherKey]: message('enter', lang, label) };
    const error = checkName(other, label, lang);
    return error ? { [otherKey]: error } : {};
  }

  let error = null;
  if (field.rule === 'name') error = checkName(value, label, lang);
  // Thailand is the default country; a number starting with + is checked
  // against the rules of its own country, so longer foreign numbers pass.
  if (field.rule === 'phone' && !isValidPhoneNumber(value, 'TH')) error = message('phone', lang);
  if (field.rule === 'email' && !EMAIL.test(value)) error = message('email', lang);
  return error ? { [field.name]: error } : {};
}

// Every error on one step, in the order the fields appear.
export function validateStep(step, answers, lang) {
  let errors = {};
  for (const field of FIELDS.filter((candidate) => candidate.step === step)) {
    errors = { ...errors, ...checkField(field, answers, lang) };
  }
  return errors;
}
