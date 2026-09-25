// One list drives both the patient form and the staff card, so a field is
// added, renamed or reordered in one place. `name` is also the database column.
export const FIELDS = [
  {
    name: 'first_name',
    label: { th: 'ชื่อ', en: 'First name' },
    autoComplete: 'given-name',
    required: true,
  },
  {
    name: 'middle_name',
    label: { th: 'ชื่อกลาง', en: 'Middle name' },
    autoComplete: 'additional-name',
    required: false,
  },
  {
    name: 'last_name',
    label: { th: 'นามสกุล', en: 'Last name' },
    autoComplete: 'family-name',
    required: true,
  },
  {
    name: 'phone_number',
    label: { th: 'เบอร์โทรศัพท์', en: 'Phone number' },
    type: 'tel',
    autoComplete: 'tel',
    required: true,
  },
];