// Barcha oʻzbekcha matnlar shu faylda. Kodda matn qatorlari yozilmaydi —
// rus tili keyin qoʻshilsa shu fayl nusxalanadi, qolgan kodga tegilmaydi.

// Xato kodi → foydalanuvchi koʻradigan matn.
// Texnik tafsilot javobga tushmaydi, faqat logga yoziladi.
export const ERROR_TEXT = {
  bad_request: 'Soʻrov notoʻgʻri yuborildi',
  unauthorized: 'Avval tizimga kiring',
  forbidden: 'Bu amal uchun ruxsatingiz yoʻq',
  not_found: 'Topilmadi',
  conflict: 'Bunday yozuv allaqachon bor',
  validation: 'Kiritilgan maʼlumotda xatolik bor',
  rate_limited: 'Juda koʻp urinish boʻldi. Biroz kutib, qayta urinib koʻring',
  subscription_expired:
    'Obuna muddati tugagan. Maʼlumot koʻrinadi, lekin yangi yozuv qoʻshib boʻlmaydi',
  internal: 'Kutilmagan xatolik yuz berdi. Biroz oʻtib qayta urinib koʻring',
} as const

// Forma tekshiruvi matnlari
export const VALIDATION_TEXT = {
  fio_required: 'F.I.O. kiritilishi shart',
  fio_too_short: 'Kamida 3 ta harf kiriting',
  fio_letters_only: 'Ismda faqat harflar boʻlishi mumkin',
  phone_incomplete: 'Raqam toʻliq emas: +998 XX XXX XX XX',
  date_invalid: 'Sana notoʻgʻri',
  date_in_future: 'Sana kelajakda boʻlishi mumkin emas',
  date_too_old: 'Sana juda qadimgi',
} as const

// Qiymat yoʻqligini bildiruvchi belgi — jadvallarda boʻsh katak oʻrniga
export const EMPTY_MARK = '—'

// Pul birligi. Diqqat: «ʻ» — U+02BB, oddiy apostrof emas
export const CURRENCY = 'soʻm'

// Rol shablonlarining koʻrinadigan nomlari
export const ROLE_LABELS = {
  owner: 'Egasi',
  shifokor: 'Shifokor',
  qabulxona: 'Qabulxona',
  techRole: 'Texnik',
  kuzatuvchi: 'Kuzatuvchi',
} as const

// Kirish va roʻyxatdan oʻtish
export const AUTH_TEXT = {
  clinic_name_too_short: 'Klinika nomi kamida 2 belgi boʻlsin',
  full_name_too_short: 'Ism-familiyani toʻliq yozing',
  email_invalid: 'Pochta manzili notoʻgʻri yozilgan',
  password_too_short: 'Parol kamida 8 belgidan iborat boʻlsin',
  password_too_long: 'Parol juda uzun',
  phone_invalid: 'Telefon raqami toʻliq emas',
  email_taken: 'Bu pochta manzili allaqachon roʻyxatdan oʻtgan',
  // Ataylab umumiy: pochta bor-yoʻqligini oshkor qilmaydi
  login_failed_msg: 'Pochta yoki parol notoʻgʻri',
  account_disabled: 'Hisobingiz faolsizlantirilgan. Klinika egasiga murojaat qiling',
  email_not_verified: 'Avval pochtangizni tasdiqlang — havola xatingizga yuborilgan',
  link_invalid: 'Havola yaroqsiz yoki muddati oʻtgan',
  disposable_email: 'Bir martalik pochta xizmatlari qabul qilinmaydi',
  too_many_attempts: 'Juda koʻp urinish boʻldi. Bir necha daqiqadan keyin qayta urinib koʻring',
  too_many_registrations:
    'Bugun bu qurilmadan juda koʻp roʻyxatdan oʻtish boʻldi. Ertaga urinib koʻring',
  verify_subject: 'E-Dentist — pochtangizni tasdiqlang',
} as const

// Kabinet interfeysi
export const UI_TEXT = {
  brand: 'E-Dentist',
  offline: 'Server bilan aloqa yoʻq. Internetni tekshirib, qayta urinib koʻring',
  login: 'Kirish',
  logout: 'Chiqish',
  register: 'Roʻyxatdan oʻtish',
  email: 'Pochta',
  password: 'Parol',
  clinic_name: 'Klinika nomi',
  phone: 'Telefon',
  full_name: 'Ism-familiya',
  have_account: 'Hisobingiz bormi?',
  no_account: 'Hisobingiz yoʻqmi?',
  sending: 'Yuborilmoqda…',
  loading: 'Yuklanmoqda…',
  mail_sent: 'Pochtangizga tasdiqlash havolasi yuborildi',
  mail_sent_hint: 'Xatni ochib havolani bosing. Xat koʻrinmasa, «Spam» papkasini ham tekshiring.',
  verifying: 'Tasdiqlanmoqda…',
  verified: 'Pochta tasdiqlandi',
  verified_hint: 'Endi hisobingizga kira olasiz.',
  trial_left: (days: number) => `Sinov muddati: ${days} kun qoldi`,
  trial_over: 'Sinov muddati tugadi — faqat oʻqish rejimi',
  section_soon: 'Bu boʻlim keyingi bosqichda qoʻshiladi',
  welcome: 'Xush kelibsiz',
  dashboard_hint:
    'Kabinet tayyor. Bemorlar, tashriflar va tish xaritasi keyingi bosqichda qoʻshiladi.',
} as const

// Yon menyu boʻlimlarining nomlari
export const SECTION_LABELS = {
  patients: 'Bemorlar',
  schedule: 'Qabul jadvali',
  lab: 'Texnik ishlari',
  debtors: 'Qarzdorlar',
  services: 'Narxnoma',
  expenses: 'Xarajatlar',
  reports: 'Hisobotlar',
  settings: 'Sozlamalar',
} as const

// Bemorlar
export const PATIENT_TEXT = {
  not_found: 'Bemor topilmadi',
  has_records: 'Bu bemorda tashrif yoki toʻlov yozuvlari bor — avval ularni oʻchirish kerak',
  created: 'Bemor qoʻshildi',
  updated: 'Bemor maʼlumoti yangilandi',
  deleted: 'Bemor oʻchirildi',
} as const

// Bemorlar sahifasi
export const PATIENT_UI = {
  title: 'Bemorlar',
  add: 'Yangi bemor',
  edit_title: 'Bemorni tahrirlash',
  add_title: 'Yangi bemor',
  search: 'F.I.O. yoki telefon boʻyicha qidirish',
  empty: 'Hozircha bemor yoʻq. «Yangi bemor» tugmasi bilan qoʻshing',
  nothing_found: 'Qidiruv boʻyicha hech narsa topilmadi',
  col_fio: 'F.I.O.',
  col_phone: 'Telefon',
  col_age: 'Yoshi',
  col_address: 'Manzil',
  fio: 'F.I.O.',
  phone: 'Telefon',
  birth_date: 'Tugʻilgan sana',
  address: 'Manzil',
  note: 'Izoh',
  note_hint: 'Allergiya, surunkali kasalliklar',
  save: 'Saqlash',
  saving: 'Saqlanmoqda…',
  cancel: 'Bekor qilish',
  remove: 'Oʻchirish',
  removing: 'Oʻchirilmoqda…',
  remove_title: 'Bemorni oʻchirasizmi?',
  remove_text: (fio: string) =>
    `«${fio}» kartochkasi butunlay oʻchiriladi. Bu amalni qaytarib boʻlmaydi.`,
  total: (n: number) => `Jami: ${n} ta`,
  years: (n: number) => `${n} yosh`,
  page_of: (page: number, pages: number) => `${page} / ${pages}`,
  prev: 'Oldingi',
  next: 'Keyingi',
  date_placeholder: 'KK/OO/YYYY',
} as const

// Tish holatlari. Kalitlar bazada saqlanadi, shuning uchun oʻzgarmaydi
export const TOOTH_STATUS_LABELS = {
  soglom: 'Sogʻlom',
  karies: 'Karies',
  plomba: 'Plomba',
  koronka: 'Koronka',
  koprik: 'Quyma tish (koʻprik)',
  implant: 'Implant',
  davolanmoqda: 'Davolanmoqda',
  olingan: 'Olib tashlangan',
} as const

// Koronka materiallari. Boʻsh kalit — «koʻrsatilmagan»
export const CROWN_MATERIAL_LABELS = {
  '': 'Koʻrsatilmagan',
  keramika: 'Keramika',
  'metall-keramika': 'Metall-keramika',
  sirkoniy: 'Sirkoniy',
  metall: 'Metall (quyma)',
  plastmassa: 'Plastmassa',
} as const

// Tish xaritasi
export const CHART_UI = {
  chart_label: 'Tish xaritasi',
  upper_jaw: 'Yuqori jagʻ',
  lower_jaw: 'Pastki jagʻ',
  primary_teeth: 'Sut tishlari',
  bridge_title: (teeth: readonly number[], material: string) =>
    `Koʻprik ${teeth[0]}–${teeth[teeth.length - 1]} · ${material}`,
} as const
