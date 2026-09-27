// One list drives the patient form, the review page and the staff card, so a
// field is added, renamed or reordered in one place. `name` is also the
// database column. Text comes in Thai and English: the form speaks the
// language the patient chose, and the staff view is English.
//
// Choices are stored as short English codes (`value`), never as the words the
// patient saw, so the data reads the same whichever language they used.

export const STEPS = [
  {
    id: 1,
    title: { th: 'ข้อมูลส่วนตัว', en: 'Personal details' },
    intro: {
      th: 'กรอกชื่อให้ตรงกับบัตรประชาชนหรือพาสปอร์ต',
      en: 'Enter your name as it appears on your ID card or passport.',
    },
  },
  { id: 2, title: { th: 'ข้อมูลทั่วไป', en: 'About you' } },
  { id: 3, title: { th: 'การติดต่อ', en: 'Contact details' } },
];

// After the steps above comes one more: checking the answers before sending.
export const REVIEW_STEP = STEPS.length + 1;

// Fields that share a heading inside a step.
export const GROUPS = {
  emergency: {
    title: { th: 'ผู้ติดต่อฉุกเฉิน', en: 'Emergency contact' },
    hint: {
      th: 'คนที่เราติดต่อได้ถ้ามีเหตุฉุกเฉิน ถ้าไม่มี เว้นว่างไว้ได้',
      en: "Someone we can contact in an emergency. Leave this blank if you don't have one.",
    },
  },
};

const LEAVE_BLANK = {
  th: 'ถ้าไม่มี เว้นว่างไว้ได้',
  en: "Leave this blank if you don't have one.",
};

const PHONE_HINT = {
  th: 'เบอร์ต่างประเทศ ให้ขึ้นต้นด้วย + และรหัสประเทศ เช่น +44 7400 123456',
  en: 'For a number outside Thailand, start with + and the country code, like +44 7400 123456',
};

// Each language is written in its own script, so a patient who can't read
// Thai can still find theirs. `label` is what staff and the review page show.
const LANGUAGES = [
  { value: 'th', native: 'ไทย', label: { th: 'ไทย', en: 'Thai' } },
  { value: 'en', native: 'English', label: { th: 'อังกฤษ', en: 'English' } },
  { value: 'zh', native: '中文', label: { th: 'จีน', en: 'Chinese' } },
  { value: 'ja', native: '日本語', label: { th: 'ญี่ปุ่น', en: 'Japanese' } },
  { value: 'ko', native: '한국어', label: { th: 'เกาหลี', en: 'Korean' } },
  { value: 'ru', native: 'Русский', label: { th: 'รัสเซีย', en: 'Russian' } },
  { value: 'ar', native: 'العربية', label: { th: 'อาหรับ', en: 'Arabic' } },
  { value: 'my', native: 'မြန်မာ', label: { th: 'พม่า', en: 'Burmese' } },
  { value: 'lo', native: 'ລາວ', label: { th: 'ลาว', en: 'Lao' } },
  { value: 'km', native: 'ខ្មែរ', label: { th: 'เขมร', en: 'Khmer' } },
  { value: 'other', label: { th: 'อื่น ๆ', en: 'Other' } },
];

export const FIELDS = [
  {
    name: 'first_name',
    step: 1,
    kind: 'text',
    rule: 'name',
    required: true,
    label: { th: 'ชื่อ', en: 'First name' },
    autoComplete: 'given-name',
    maxLength: 100,
  },
  {
    name: 'middle_name',
    step: 1,
    kind: 'text',
    rule: 'name',
    required: false,
    label: { th: 'ชื่อกลาง', en: 'Middle name' },
    hint: LEAVE_BLANK,
    autoComplete: 'additional-name',
    maxLength: 100,
  },
  {
    name: 'last_name',
    step: 1,
    kind: 'text',
    rule: 'name',
    required: true,
    label: { th: 'นามสกุล', en: 'Last name' },
    autoComplete: 'family-name',
    maxLength: 100,
  },
  {
    name: 'phone_number',
    step: 1,
    kind: 'tel',
    rule: 'phone',
    required: true,
    label: { th: 'เบอร์โทรศัพท์', en: 'Phone number' },
    hint: PHONE_HINT,
    autoComplete: 'tel',
    maxLength: 25,
  },
  {
    name: 'date_of_birth',
    step: 2,
    kind: 'date',
    required: true,
    label: { th: 'วันเกิด', en: 'Date of birth' },
    hint: { th: 'เช่น 15 3 2533', en: 'For example, 15 3 1990' },
  },
  {
    name: 'gender',
    step: 2,
    kind: 'radio',
    required: true,
    label: { th: 'เพศ', en: 'Gender' },
    options: [
      { value: 'male', label: { th: 'ชาย', en: 'Male' } },
      { value: 'female', label: { th: 'หญิง', en: 'Female' } },
      { value: 'other', label: { th: 'เพศอื่น ๆ', en: 'Other' } },
      { value: 'prefer_not_to_say', label: { th: 'ไม่ประสงค์จะระบุ', en: 'Prefer not to say' } },
    ],
  },
  {
    name: 'nationality',
    step: 2,
    kind: 'radio',
    required: true,
    label: { th: 'สัญชาติ', en: 'Nationality' },
    options: [
      { value: 'thai', label: { th: 'ไทย', en: 'Thai' } },
      {
        value: 'other',
        label: { th: 'สัญชาติอื่น', en: 'Another nationality' },
        // Choosing this opens a text box for the answer itself.
        other: { label: { th: 'ระบุสัญชาติ', en: 'Your nationality' }, maxLength: 50 },
      },
    ],
  },
  {
    name: 'preferred_language',
    step: 2,
    kind: 'select',
    required: true,
    defaultValue: 'th',
    label: { th: 'ภาษาที่ต้องการ', en: 'Preferred language' },
    hint: {
      th: 'ภาษาที่อยากให้เจ้าหน้าที่ใช้คุยกับคุณ',
      en: 'The language you would like staff to use with you',
    },
    options: LANGUAGES,
  },
  {
    name: 'religion',
    step: 2,
    kind: 'radio',
    required: false,
    label: { th: 'ศาสนา', en: 'Religion' },
    hint: {
      th: 'ช่วยให้เราดูแลเรื่องอาหาร ยา และพิธีทางศาสนาได้ถูกต้อง',
      en: 'This helps us get food, medicines and religious care right.',
    },
    options: [
      { value: 'buddhism', label: { th: 'พุทธ', en: 'Buddhism' } },
      { value: 'islam', label: { th: 'อิสลาม', en: 'Islam' } },
      { value: 'christianity', label: { th: 'คริสต์', en: 'Christianity' } },
      { value: 'none', label: { th: 'ไม่นับถือศาสนา', en: 'No religion' } },
      {
        value: 'other',
        label: { th: 'อื่น ๆ', en: 'Other' },
        other: { label: { th: 'ระบุศาสนา', en: 'Your religion' }, maxLength: 50 },
      },
      // Radio buttons can't be unticked, so this is the way back out.
      { value: 'prefer_not_to_say', label: { th: 'ไม่ประสงค์จะระบุ', en: 'Prefer not to say' } },
    ],
  },
  {
    name: 'email',
    step: 3,
    kind: 'email',
    rule: 'email',
    required: false,
    label: { th: 'อีเมล', en: 'Email' },
    hint: LEAVE_BLANK,
    autoComplete: 'email',
    maxLength: 254,
  },
  {
    name: 'address',
    step: 3,
    kind: 'textarea',
    required: true,
    label: { th: 'ที่อยู่', en: 'Address' },
    hint: {
      th: 'บ้านเลขที่ หมู่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์',
      en: 'House number, street, subdistrict, district, province and postcode',
    },
    autoComplete: 'street-address',
    maxLength: 500,
  },
  {
    name: 'emergency_contact_name',
    step: 3,
    group: 'emergency',
    kind: 'text',
    rule: 'name',
    required: false,
    label: { th: 'ชื่อผู้ติดต่อฉุกเฉิน', en: 'Emergency contact' },
    // These describe someone else, so the browser must not fill in the patient's own details.
    autoComplete: 'off',
    maxLength: 100,
  },
  {
    name: 'emergency_contact_relationship',
    step: 3,
    group: 'emergency',
    kind: 'text',
    required: false,
    label: { th: 'ความสัมพันธ์', en: 'Relationship' },
    hint: { th: 'เช่น แม่ ลูกสาว เพื่อน', en: 'For example, mother, daughter, friend' },
    autoComplete: 'off',
    maxLength: 50,
  },
  {
    name: 'emergency_contact_phone',
    step: 3,
    group: 'emergency',
    kind: 'tel',
    rule: 'phone',
    required: false,
    label: { th: 'เบอร์ผู้ติดต่อฉุกเฉิน', en: 'Emergency contact phone' },
    hint: PHONE_HINT,
    autoComplete: 'off',
    maxLength: 25,
  },
];
