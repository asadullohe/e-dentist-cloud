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

// Tashriflar va tish xaritasi
export const VISIT_TEXT = {
  not_found: 'Tashrif topilmadi',
  treatment_required: 'Muolaja nomini yozing',
  date_required: 'Sana kiritilishi shart',
  price_negative: 'Narx manfiy boʻlishi mumkin emas',
  tooth_invalid: 'Bunday tish raqami yoʻq',
  status_invalid: 'Bunday tish holati yoʻq',
  material_invalid: 'Bunday material yoʻq',
  bridge_not_found: 'Koʻprik topilmadi',
  bridge_same_arch: 'Ikkala tish ham bitta jagʻda boʻlishi kerak',
  bridge_role_invalid: 'Tish roli notoʻgʻri',
} as const

// Koʻprik (quyma tish) oynasi
export const BRIDGE_UI = {
  title_new: 'Yangi koʻprik (quyma tish)',
  add: 'Koʻprik qoʻshish',
  first_tooth: 'Birinchi tish',
  last_tooth: 'Oxirgi tish',
  upper_jaw: 'Yuqori jagʻ',
  lower_jaw: 'Pastki jagʻ',
  span: (count: number) => `Oraliqdagi tishlar (${count} ta)`,
  span_same_arch: 'Ikkala tish ham bitta jagʻda boʻlishi kerak',
  role_crown: 'Koronka',
  role_pontic: 'Quyma tish',
  hint: 'Tishi bor joyga koronka, tishi yoʻq joyga quyma tish tanlang.',
  existing: 'Koʻpriklar',
  delete_title: 'Koʻprik oʻchirilsinmi?',
  delete_text: 'Quyma tishlar «olib tashlangan», koronkalar «sogʻlom» holatiga qaytadi.',
} as const

// Bemor kartochkasi
export const CARD_UI = {
  back: 'Bemorlar',
  tab_visits: 'Tashriflar',
  tab_chart: 'Tish xaritasi',
  add_visit: 'Tashrif qoʻshish',
  edit_visit: 'Tashrifni tahrirlash',
  no_visits: 'Hozircha tashrif yozilmagan',
  date: 'Sana',
  treatment: 'Muolaja',
  tooth: 'Tish',
  price: 'Narx',
  note: 'Izoh',
  total: 'Jami',
  delete_visit_title: 'Tashrif oʻchirilsinmi?',
  delete_visit_text: 'Bu amalni qaytarib boʻlmaydi.',
  tooth_title: (tooth: number) => `${tooth}-tish`,
  status: 'Holat',
  material: 'Material',
  save: 'Saqlash',
  cancel: 'Bekor qilish',
  delete: 'Oʻchirish',
  edit: 'Tahrirlash',
  age_years: (years: number) => `${years} yosh`,
  no_phone: 'Telefon koʻrsatilmagan',
} as const

// Bemor rasmlari
export const IMAGE_TEXT = {
  not_found: 'Rasm topilmadi',
  no_file: 'Fayl tanlanmagan',
  too_large: 'Fayl juda katta — eng koʻpi 10 MB',
  wrong_type: 'Faqat rasm yuklash mumkin: JPEG, PNG yoki WebP',
  caption_long: 'Izoh juda uzun',
} as const

export const IMAGE_UI = {
  tab: 'Rasmlar',
  upload: 'Rasm yuklash',
  uploading: 'Yuklanmoqda…',
  empty: 'Hozircha rasm yuklanmagan',
  delete_title: 'Rasm oʻchirilsinmi?',
  delete_text: 'Bu amalni qaytarib boʻlmaydi.',
  caption_placeholder: 'Izoh (ixtiyoriy)',
} as const

// Toʻlovlar va qarzdorlik
export const PAYMENT_TEXT = {
  not_found: 'Toʻlov topilmadi',
  amount_positive: 'Summa noldan katta boʻlishi kerak',
  date_required: 'Sana kiritilishi shart',
} as const

export const PAYMENT_UI = {
  tab: 'Toʻlovlar',
  add: 'Toʻlov qabul qilish',
  edit: 'Toʻlovni tahrirlash',
  empty: 'Hozircha toʻlov qilinmagan',
  date: 'Sana',
  amount: 'Summa',
  note: 'Izoh',
  charges: 'Tashriflar',
  paid: 'Toʻlangan',
  debt: 'Qarz',
  /// Qarz manfiy boʻlsa bemor oldindan toʻlagan
  prepaid: 'Oldindan toʻlangan',
  no_debt: 'Qarz yoʻq',
  delete_title: 'Toʻlov oʻchirilsinmi?',
  delete_text: 'Bu amalni qaytarib boʻlmaydi.',
} as const

export const DEBTORS_UI = {
  title: 'Qarzdorlar',
  empty: 'Qarzdor bemorlar yoʻq',
  total: 'Jami qarz',
  count: (n: number) => `${n} ta bemor`,
  patient: 'Bemor',
  phone: 'Telefon',
} as const

// Narxnoma
export const SERVICE_TEXT = {
  not_found: 'Xizmat topilmadi',
  name_required: 'Xizmat nomini yozing',
  name_taken: 'Bunday nomli xizmat allaqachon bor',
  price_negative: 'Narx manfiy boʻlishi mumkin emas',
} as const

export const SERVICE_UI = {
  title: 'Narxnoma',
  add: 'Xizmat qoʻshish',
  edit: 'Xizmatni tahrirlash',
  empty: 'Narxnoma hozircha boʻsh',
  name: 'Xizmat',
  price: 'Narx',
  pick: 'Narxnomadan tanlash',
  pick_placeholder: 'Xizmatni tanlang',
  delete_title: 'Xizmat oʻchirilsinmi?',
  delete_text: 'Bu amalni qaytarib boʻlmaydi.',
} as const

// Excel: ustun sarlavhalari. Import ham, eksport ham shu roʻyxatga tayanadi —
// chiqarilgan fayl aynan shablon boʻlishi kerak (tz.md 8-boʻlim)
export const PATIENT_EXCEL_COLUMNS = {
  id: 'ID',
  fio: 'F.I.O.',
  phone: 'Telefon',
  birthDate: 'Tugʻilgan sana',
  address: 'Manzil',
  note: 'Izoh',
} as const

export const EXCEL_UI = {
  template: 'Shablon',
  export: 'Excelga chiqarish',
  downloading: 'Tayyorlanmoqda…',
} as const

export const EXCEL_TEXT = {
  sheet_patients: 'Bemorlar',
  sheet_guide: 'Qoʻllanma',
  template_file: 'bemorlar-shablon.xlsx',
  export_file: (date: string) => `bemorlar-${date}.xlsx`,
  guide_title: 'Bemorlarni Excel dan yuklash',
  guide_rows: [
    ['Ustun', 'Majburiy', 'Qanday yoziladi'],
    ['ID', 'Yoʻq', 'Faqat chiqarilgan faylda boʻladi. Bor boʻlsa mavjud bemor yangilanadi'],
    ['F.I.O.', 'Ha', 'Kamida 3 belgi'],
    ['Telefon', 'Yoʻq', '901234567 · +998901234567 · 90 123 45 67 — hammasi boʻladi'],
    ['Tugʻilgan sana', 'Yoʻq', 'Kun/oy/yil: 12/05/1990. Excel sana katagi ham boʻladi'],
    ['Manzil', 'Yoʻq', 'Erkin matn'],
    ['Izoh', 'Yoʻq', 'Allergiya, surunkali kasalliklar'],
  ],
  guide_notes: [
    'Ustunlar sarlavha nomi boʻyicha tanaladi — tartibini oʻzgartirsangiz ham ishlaydi.',
    'Birinchi qator sarlavha boʻlishi kerak.',
    'Sana kun/oy/yil tartibida oʻqiladi: 05/12/1990 — 5-dekabr.',
    'Bu faylni toʻldirib, kabinetdagi «Excel dan yuklash» orqali qaytaring.',
  ],
} as const

// Excel dan yuklash
export const IMPORT_TEXT = {
  no_file: 'Fayl tanlanmagan',
  wrong_type: 'Faqat .xlsx yoki .csv fayl yuklash mumkin',
  too_large: 'Fayl juda katta — eng koʻpi 5 MB',
  too_many_rows: (max: number) => `Faylda ${max} qatordan koʻp — kichikroq boʻlaklarga boʻling`,
  empty: 'Faylda maʼlumot yoʻq',
  column_missing: (name: string) =>
    `«${name}» ustuni topilmadi. Shablonni yuklab olib, sarlavhalarni solishtiring.`,
  session_expired: 'Yuklash seansi eskirdi — faylni qaytadan tanlang',
  // Qator xatolari
  fio_required: 'F.I.O. boʻsh',
  fio_short: 'F.I.O. kamida 3 belgi boʻlishi kerak',
  phone_invalid: 'Telefon raqamini oʻqib boʻlmadi',
  date_invalid: 'Sanani oʻqib boʻlmadi — kun/oy/yil koʻrinishida yozing',
  date_future: 'Sana kelajakda',
  date_old: 'Sana juda qadimgi',
  id_unknown: 'Bunday ID li bemor topilmadi',
} as const

export const IMPORT_UI = {
  title: 'Excel dan yuklash',
  pick_file: 'Fayl tanlash',
  reading: 'Fayl oʻqilmoqda…',
  has_header: 'Birinchi qator — sarlavha',
  total: (n: number) => `${n} qator`,
  valid: (n: number) => `${n} ta toʻgʻri`,
  errors: (n: number) => `${n} tasida xato`,
  duplicates: (n: number) => `${n} ta takror`,
  preview_note: 'Birinchi 20 qator koʻrsatilyapti',
  duplicate_mode: 'Takrorlangan bemorlar bilan nima qilinsin?',
  mode_skip: 'Oʻtkazib yuborish',
  mode_update: 'Mavjudini yangilash',
  mode_add: 'Baribir qoʻshish',
  commit: 'Yuklash',
  committing: 'Yuklanmoqda…',
  done: 'Yuklash tugadi',
  added: (n: number) => `${n} ta qoʻshildi`,
  updated: (n: number) => `${n} ta yangilandi`,
  skipped: (n: number) => `${n} ta oʻtkazib yuborildi`,
  download_errors: 'Xatoli qatorlarni yuklab olish',
  errors_file: 'yuklashdagi-xatolar.xlsx',
  error_column: 'Xato',
  row_column: 'Qator',
  duplicate_label: 'takror',
  cancel: 'Bekor qilish',
  close: 'Yopish',
} as const

// Qabul jadvali
export const APPOINTMENT_TEXT = {
  not_found: 'Qabul topilmadi',
  patient_required: 'Bemorni tanlang',
  time_required: 'Vaqt kiritilishi shart',
  time_invalid: 'Vaqtni oʻqib boʻlmadi — soat:daqiqa koʻrinishida yozing',
} as const

/// Holat kalitlari bazada saqlanadi, shuning uchun oʻzgarmaydi
export const APPOINTMENT_STATUS_LABELS = {
  scheduled: 'Rejalashtirilgan',
  arrived: 'Keldi',
  no_show: 'Kelmadi',
  done: 'Yakunlandi',
  cancelled: 'Bekor qilindi',
} as const

export const SCHEDULE_UI = {
  title: 'Qabul jadvali',
  add: 'Qabul qoʻshish',
  edit: 'Qabulni tahrirlash',
  empty_day: 'Bu kunga qabul yoʻq',
  today: 'Bugun',
  patient: 'Bemor',
  time: 'Vaqt',
  date: 'Sana',
  status: 'Holat',
  note: 'Izoh',
  pick_patient: 'Bemorni qidiring',
  no_matches: 'Bemor topilmadi',
  delete_title: 'Qabul oʻchirilsinmi?',
  delete_text: 'Bu amalni qaytarib boʻlmaydi.',
  month_total: (n: number) => `${n} ta qabul`,
  date_unreadable: 'Sanani oʻqib boʻlmadi',
} as const
