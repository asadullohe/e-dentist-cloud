// Oʻzbekcha matnlar — asosiy til. Har toʻplam bitta ekran yoki mavzu.
//
// Boshqa tillar (locales/ru.ts) shu tuzilmani takrorlaydi; tarjima
// qilinmagan kalit oʻzbekchaga qaytadi. Ilova matnni `strings.ts` dagi
// jonli eksportlar orqali oʻqiydi — bu faylni toʻgʻridan-toʻgʻri import
// qilmang, til almashganda yangilanmay qoladi.
//
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
  doctor_invalid: 'Shifokor notoʻgʻri',
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
  offline_title: 'Server bilan aloqa yoʻq',
  retry: 'Qayta urinish',
  login: 'Kirish',
  logout: 'Chiqish',
  logout_confirm_title: 'Hisobdan chiqasizmi?',
  logout_confirm_text: 'Qayta kirish uchun pochta va parol soʻraladi.',
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
  // Kutilmagan xato — ildizdagi ErrorBoundary
  error_title: 'Xatolik yuz berdi',
  error_text: 'Sahifani yangilang. Takrorlansa, qoʻllab-quvvatlashga yozing.',
  reload: 'Sahifani yangilash',
  mail_sent: 'Pochtangizga tasdiqlash havolasi yuborildi',
  mail_sent_hint: 'Xatni ochib havolani bosing. Xat koʻrinmasa, «Spam» papkasini ham tekshiring.',
  verifying: 'Tasdiqlanmoqda…',
  verified: 'Pochta tasdiqlandi',
  verified_hint: 'Endi hisobingizga kira olasiz.',
  trial_left: (days: number) => `Sinov muddati: ${days} kun qoldi`,
  trial_over: 'Sinov muddati tugadi — faqat oʻqish rejimi',
  subscription_over:
    'Obuna muddati tugadi — faqat oʻqish rejimi. Muddatni uzaytirish uchun bogʻlaning',
  section_soon: 'Bu boʻlim keyingi bosqichda qoʻshiladi',
  menu: 'Menyu',
  // Jadval qatorlaridagi umumiy amallar — qisqa, obyekt nomisiz
  edit: 'Tahrirlash',
  remove: 'Oʻchirish',
  language: 'Til',
  theme_light: 'Yorugʻ rejim',
  theme_dark: 'Tungi rejim',
  // Sana maydoni: qoʻlda yoziladi yoki kalendardan tanlanadi
  date_placeholder: 'KK/OO/YYYY',
  pick_date: 'Kalendardan tanlash',
  time_placeholder: 'SS:DD',
  pick_time: 'Vaqtni tanlash',
  close: 'Yopish',
  cancel: 'Bekor qilish',
  welcome: 'Xush kelibsiz',
} as const

// Bosh sahifa: bugungi holat bir qarashda
export const HOME_UI = {
  today_appointments: 'Bugungi qabullar',
  arrived: (n: number) => `${n} ta keldi`,
  patients: 'Bemorlar',
  new_this_month: (n: number) => `shu oy ${n} ta yangi`,
  month_income: 'Shu oy tushum',
  month_visits: (n: number) => `${n} ta tashrif`,
  debt: 'Qarzdorlik',
  debtors: (n: number) => `${n} ta bemor`,
  no_appointments: 'Bugunga qabul yoʻq',
  open_schedule: 'Jadval',
  top_debtors: 'Eng katta qarzdorlar',
  no_debtors: 'Qarzdorlar yoʻq',
  all_debtors: 'Barchasi',
} as const

// Yon menyu boʻlimlarining nomlari
export const SECTION_LABELS = {
  home: 'Bosh sahifa',
  patients: 'Bemorlar',
  schedule: 'Qabul jadvali',
  lab: 'Texnik ishlari',
  debtors: 'Qarzdorlar',
  services: 'Xizmatlar',
  expenses: 'Xarajatlar',
  reports: 'Hisobotlar',
  payroll: 'Ish haqi',
  queue: 'Navbat',
  settings: 'Sozlamalar',
} as const

// Bemorlar
export const PATIENT_TEXT = {
  not_found: 'Bemor topilmadi',
  has_records: 'Bu bemorda tashrif yoki toʻlov yozuvlari bor — avval ularni oʻchirish kerak',
  created: 'Bemor qoʻshildi',
  updated: 'Bemor maʼlumoti yangilandi',
  deleted: 'Bemor oʻchirildi',
  doctor_not_found: 'Bu xodim shifokor emas yoki faol emas',
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
  col_doctor: 'Shifokor',
  doctor: 'Shifokor',
  doctor_none: 'Biriktirilmagan',
  doctor_hint: 'Tashrif va qabulda shu shifokor sukut boʻyicha tanlanadi',
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
  doctor_invalid: 'Shifokorni tanlang',
  doctor_not_found: 'Bu xodim tashrifga shifokor boʻla olmaydi',
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
  // Kartochka boʻlimlarining tavsifi (chap navigatsiyali koʻrinish)
  visits_hint: 'Qabullar, davolash va narxlar',
  chart_hint: 'Tishlar holati va koʻpriklar',
  payments_hint: 'Toʻlovlar va qarzdorlik',
  images_hint: 'Rentgen va boshqa rasmlar',
  lab_hint: 'Protez ustasiga berilgan naryadlar',
  add_visit: 'Tashrif qoʻshish',
  edit_visit: 'Tashrifni tahrirlash',
  no_visits: 'Hozircha tashrif yozilmagan',
  date: 'Sana',
  time: 'Vaqt',
  treatment: 'Muolaja',
  tooth: 'Tish',
  price: 'Narx',
  note: 'Izoh',
  doctor: 'Shifokor',
  doctor_unknown: 'Koʻrsatilmagan',
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
  // Toʻlov oʻchirilmaydi, bekor qilinadi — sabab bilan (11-bosqich)
  already_cancelled: 'Bu toʻlov allaqachon bekor qilingan',
  cancelled_immutable: 'Bekor qilingan toʻlovni oʻzgartirib boʻlmaydi',
  reason_required: 'Bekor qilish sababini yozing',
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
  // Toʻlov oʻchirilmaydi — bekor qilinadi, sabab bilan (11-bosqich)
  // «Bekor qilish» tugmasi (yopish) bilan adashmasin — toʻliq nom
  cancel: 'Toʻlovni bekor qilish',
  cancel_title: 'Toʻlov bekor qilinsinmi?',
  cancel_text:
    'Toʻlov oʻchirilmaydi: roʻyxatda «bekor qilingan» deb qoladi, hisobga va qarzdorlarga kirmaydi. Sababini yozing — u toʻlov yonida koʻrinib turadi.',
  cancel_reason: 'Sabab',
  cancel_reason_placeholder: 'Masalan: summa notoʻgʻri kiritilgan, bemorga qaytarildi',
  cancelled: 'Bekor qilingan',
  cancelled_by: (name: string, date: string) => `${name || '—'} · ${date}`,
  received_by: 'Qabul qildi',
  edit_note: 'Izohni tahrirlash',
  edit_hint: 'Summa va sana oʻzgarmaydi. Xato boʻlsa toʻlovni bekor qilib, yangisini kiriting.',
} as const

export const DEBTORS_UI = {
  title: 'Qarzdorlar',
  empty: 'Qarzdor bemorlar yoʻq',
  total: 'Jami qarz',
  count: (n: number) => `${n} ta bemor`,
  patient: 'Bemor',
  phone: 'Telefon',
} as const

// Xizmatlar: tur (Jarrohlik, Terapiya…) → xizmat (nom + narx)
export const SERVICE_TEXT = {
  not_found: 'Xizmat topilmadi',
  name_required: 'Xizmat nomini yozing',
  name_taken: 'Bu turda bunday nomli xizmat allaqachon bor',
  price_negative: 'Narx manfiy boʻlishi mumkin emas',
  type_required: 'Xizmat turini tanlang',
  type_not_found: 'Xizmat turi topilmadi',
  type_name_required: 'Tur nomini yozing',
  type_name_taken: 'Bunday nomli tur allaqachon bor',
  type_has_services: (n: number) =>
    `Bu turda ${n} ta xizmat bor — avval ularni boshqa turga koʻchiring`,
  order_invalid: 'Tartib roʻyxati toʻliq emas',
} as const

export const SERVICE_UI = {
  title: 'Xizmatlar',
  summary: (types: number, services: number) => `${types} tur · ${services} xizmat`,
  add: 'Xizmat qoʻshish',
  edit: 'Xizmatni tahrirlash',
  empty: 'Bu turda hozircha xizmat yoʻq',
  empty_types: 'Hozircha tur yoʻq — birinchisini qoʻshing',
  name: 'Xizmat',
  price: 'Narx',
  search: 'Xizmat nomi boʻyicha qidirish',
  nothing_found: 'Bunday xizmat topilmadi',
  pick: 'Xizmatlardan tanlash',
  pick_placeholder: 'Xizmatni tanlang',
  delete_title: 'Xizmat oʻchirilsinmi?',
  delete_text: 'Bu amalni qaytarib boʻlmaydi.',
  // Turlar
  tech_switch: 'Texnik ishi bor',
  tech_price: 'Texnik narxi',
  tech_hint: 'Tashrifga koʻchadi; shifokor ulushi (narx − texnik narxi) dan hisoblanadi',
  tech_short: (price: string) => `Texnik: ${price}`,
  type: 'Turi',
  types: 'Turlar',
  type_add: 'Yangi tur',
  type_edit: 'Turni tahrirlash',
  type_name: 'Tur nomi',
  type_name_placeholder: 'Jarrohlik, Terapiya, Ortopediya…',
  type_count: (n: number) => `${n} ta xizmat`,
  type_delete_title: 'Tur oʻchirilsinmi?',
  type_delete_text: 'Ichida xizmati bor tur oʻchirilmaydi.',
  back: 'Xizmatlar',
  drag: 'Tartibni oʻzgartirish',
  drag_hint: 'Tutqichdan tortib joylashtiring',
} as const

// Xarajat xatolari
export const EXPENSE_TEXT = {
  not_found: 'Xarajat topilmadi',
  description_required: 'Nima uchun sarflanganini yozing',
  date_required: 'Sana kiritilishi shart',
  amount_required: 'Summani kiriting',
  category_invalid: 'Bunday turkum yoʻq',
  month_invalid: 'Oyni oʻqib boʻlmadi',
  range_invalid: 'Davr notoʻgʻri: boshi oxiridan keyin yoki bir yildan uzun',
} as const

/// Turkum nomlari. Bazada inglizcha kalit, ekranda shu matn
export const EXPENSE_CATEGORY_LABELS = {
  materials: 'Materiallar',
  equipment: 'Uskuna',
  rent: 'Ijara',
  utilities: 'Kommunal',
  salary: 'Ish haqi',
  ads: 'Reklama',
  tax: 'Soliq',
  lab: 'Texnik ishlari',
  other: 'Boshqa',
} as const

// Xarajatlar sahifasi
export const EXPENSE_UI = {
  title: 'Xarajatlar',
  subtitle: 'Klinika xarajatlarini yozib borish',
  add: 'Yangi xarajat',
  edit: 'Xarajatni tahrirlash',
  empty: 'Bu davrda xarajat yozilmagan',
  date: 'Sana',
  category: 'Turkumi',
  description: 'Nima uchun',
  description_hint: 'Masalan: plomba materiali',
  amount: 'Summa',
  total: 'Jami',
  this_month: 'Shu oy',
  prev_month: 'Oldingi oy',
  next_month: 'Keyingi oy',
  delete_title: 'Xarajat oʻchirilsinmi?',
  delete_text: 'Bu amalni qaytarib boʻlmaydi.',
} as const

// Hisobotlar sahifasi
export const REPORT_UI = {
  title: 'Hisobotlar',
  subtitle: 'Kun, hafta, oy yoki yil boʻyicha daromad va tashriflar tahlili',
  visits: 'Tashriflar',
  charges: 'Qilingan ish narxi',
  payments: 'Tushum (toʻlovlar)',
  expenses: 'Xarajatlar',
  profit: 'Sof foyda',
  new_patients: 'Yangi bemorlar',
  last_months: 'Oxirgi 12 oy',
  chart_hint: 'Ustunni bosing — oʻsha oyga oʻtadi',
  treatments_title: 'Muolajalar',
  expenses_title: 'Xarajatlar',
  treatment: 'Muolaja',
  category: 'Turkumi',
  count: 'Soni',
  total: 'Jami',
  empty_visits: 'Bu davrda tashrif boʻlmagan',
  empty_expenses: 'Bu davrda xarajat yozilmagan',
} as const

// Ish haqi (tz.md 15-boʻlim)
export const PAYROLL_TEXT = {
  staff_not_found: 'Xodim topilmadi',
  payout_not_found: 'Toʻlov topilmadi',
  amount_required: 'Summa noldan katta boʻlishi kerak',
  expense_note: (name: string, month: string) => `Ish haqi: ${name} — ${month}`,
} as const

export const PAYROLL_UI = {
  title: 'Ish haqi',
  subtitle: 'Oy boʻyicha xodimlarning ulushi va oyligi',
  own_subtitle: 'Shu oyda qilgan ishlaringiz va ulushingiz',
  staff: 'Xodim',
  visits: 'Tashriflar',
  charges: 'Ish summasi',
  percent: 'Foiz',
  share: 'Ulush',
  salary: 'Oylik',
  total: 'Jami',
  paid: 'Toʻlangan',
  remaining: 'Qoldiq',
  totals: 'Jami',
  empty: 'Bu oyda hisoblanadigan narsa yoʻq',
  unassigned: (count: number, sum: string) =>
    `Shifokor koʻrsatilmagan tashriflar: ${count} ta, ${sum}. Ular hech kimning ulushiga kirmaydi — tashrifni tahrirlab shifokorni tanlang.`,
  no_terms_hint: 'Ish haqi sharti Sozlamalar → Xodimlar da belgilanadi.',
  // Ishlar roʻyxati
  works_title: (name: string) => `${name} — ishlari`,
  works_empty: 'Bu oyda tashrif yoʻq',
  date: 'Sana',
  patient: 'Bemor',
  treatment: 'Muolaja',
  tooth: 'Tish',
  price: 'Narx',
  // Protez ishi: foiz (narx − texnik narxi) dan
  lab_cost: 'Texnik narxi',
  show_works: 'Ishlarini koʻrish',
  // Qayta hisoblash
  recalculate: 'Qayta hisoblash',
  recalculate_title: 'Ulushni qayta hisoblash',
  recalculate_text: (name: string, percent: number, month: string) =>
    `${name} ning ${month} oyidagi barcha tashriflariga joriy foiz (${percent}%) qayta yoziladi. Bu amal ortga qaytmaydi.`,
  recalculated: (count: number) => `${count} ta tashrif qayta hisoblandi`,
  // Toʻlab berish
  pay: 'Toʻlash',
  pay_title: (name: string, month: string) => `Toʻlovlar — ${name}, ${month}`,
  pay_hint: 'Har toʻlov «Oylik» turkumida xarajatga tushadi. Qisman yoki avans toʻlash mumkin.',
  amount: 'Summa (soʻm)',
  pay_date: 'Sana',
  note: 'Izoh',
  add_payout: 'Toʻlovni yozish',
  payouts_empty: 'Hali toʻlanmagan',
  delete_payout: 'Oʻchirish',
  delete_payout_title: 'Toʻlov oʻchirilsinmi?',
  delete_payout_text: 'Xarajat ham oʻchadi. Bu amalni qaytarib boʻlmaydi.',
} as const

// Amal bajarilgach chiqadigan qisqa xabarlar (toast). Bitta qolip:
// «nima» + «nima boʻldi». Xato matnlari serverdan keladi, bu yerda yoʻq
export const TOAST_TEXT = {
  // Qoʻshish va tahrirlash — ikki xil amal, ikki xil matn
  patient_created: 'Bemor qoʻshildi',
  patient_updated: 'Bemor tahrirlandi',
  patient_deleted: 'Bemor oʻchirildi',
  visit_created: 'Tashrif qoʻshildi',
  visit_updated: 'Tashrif tahrirlandi',
  visit_deleted: 'Tashrif oʻchirildi',
  tooth_saved: 'Tish holati saqlandi',
  bridge_added: 'Koʻprik qoʻshildi',
  bridge_deleted: 'Koʻprik oʻchirildi',
  image_uploaded: 'Rasm yuklandi',
  image_deleted: 'Rasm oʻchirildi',
  payment_created: 'Toʻlov qabul qilindi',
  payment_updated: 'Toʻlov tahrirlandi',
  payment_deleted: 'Toʻlov oʻchirildi',
  payment_cancelled: 'Toʻlov bekor qilindi',
  appointment_created: 'Qabul yozildi',
  appointment_updated: 'Qabul tahrirlandi',
  appointment_deleted: 'Qabul oʻchirildi',
  block_saved: 'Band vaqt saqlandi',
  block_deleted: 'Band vaqt oʻchirildi',
  // Holat oʻzgarishi — qaysi holatga oʻtgani aytiladi
  appointment_arrived: 'Bemor keldi deb belgilandi',
  appointment_no_show: 'Bemor kelmadi deb belgilandi',
  appointment_done: 'Qabul yakunlandi — tashrif yozildi',
  appointment_cancelled: 'Qabul bekor qilindi',
  appointment_scheduled: 'Qabul qayta rejalashtirildi',
  expense_created: 'Xarajat qoʻshildi',
  expense_updated: 'Xarajat tahrirlandi',
  expense_deleted: 'Xarajat oʻchirildi',
  service_created: 'Xizmat qoʻshildi',
  service_updated: 'Xizmat tahrirlandi',
  service_deleted: 'Xizmat oʻchirildi',
  service_type_created: 'Tur qoʻshildi',
  service_type_updated: 'Tur tahrirlandi',
  service_type_deleted: 'Tur oʻchirildi',
  staff_created: 'Xodim qoʻshildi',
  staff_role_changed: 'Xodimning roli oʻzgartirildi',
  staff_disabled: 'Xodim faolsizlantirildi',
  staff_enabled: 'Xodim faollashtirildi',
  staff_pay_saved: 'Ish haqi sharti saqlandi',
  role_saved: 'Rol ruxsatlari saqlandi',
  password_changed: 'Parol almashtirildi',
  lab_created: 'Naryad yozildi',
  lab_updated: 'Naryad tahrirlandi',
  lab_deleted: 'Naryad oʻchirildi',
  lab_ready: 'Naryad tayyor deb belgilandi',
  lab_delivered: 'Naryad topshirildi',
  lab_issued: 'Naryad texnikka qaytadan berildi',
  lab_returned: 'Naryad qaytarildi',
  payout_saved: 'Ish haqi toʻlovi yozildi',
  payout_deleted: 'Ish haqi toʻlovi oʻchirildi',
  logo_saved: 'Logotip saqlandi',
  logo_removed: 'Logotip olib tashlandi',
  queue_enabled: 'Navbat yoqildi',
  queue_disabled: 'Navbat oʻchirildi',
  enqueued: (name: string, number: number) => `${name} navbatga qoʻshildi — №${number}`,
  import_done: (added: number, updated: number) =>
    `Yuklandi: ${added} ta yangi, ${updated} ta yangilandi`,
} as const

// Xodimlar va rollar
export const STAFF_TEXT = {
  not_found: 'Xodim topilmadi',
  email_taken: 'Bu pochta bilan hisob allaqachon bor',
  role_not_found: 'Rol topilmadi',
  self_change: 'Oʻz rolingizni yoki holatingizni oʻzgartira olmaysiz',
  last_owner: 'Klinikada kamida bitta faol egasi qolishi shart',
  role_required: 'Rolni tanlang',
  name_required: 'Ism-familiyani yozing',
  password_wrong: 'Joriy parol notoʻgʻri',
  password_same: 'Yangi parol eskisidan farq qilishi kerak',
  salary_negative: 'Oylik manfiy boʻlishi mumkin emas',
  percent_range: 'Foiz 0 dan 100 gacha boʻlishi kerak',
} as const

// Sozlamalar → Xodimlar va Rollar
export const STAFF_UI = {
  title: 'Sozlamalar',
  staff_tab: 'Xodimlar',
  roles_tab: 'Rollar',
  account_tab: 'Hisobim',
  add: 'Xodim qoʻshish',
  add_title: 'Yangi xodim',
  add_hint:
    'Parolni siz belgilaysiz va xodimga aytasiz. U kirgach «Hisobim» boʻlimida oʻzgartira oladi.',
  password: 'Boshlangʻich parol',
  name: 'Xodim',
  email: 'Pochta',
  role: 'Rol',
  status: 'Holat',
  last_login: 'Oxirgi kirish',
  never: 'hech qachon',
  active: 'Faol',
  disabled: 'Faolsizlantirilgan',
  disable: 'Faolsizlantirish',
  enable: 'Faollashtirish',
  you: 'siz',
  permissions: 'Ruxsatlar',
  save_role: 'Saqlash',
  role_saved: 'Rol yangilandi',
  owner_locked: 'Egasi bu ruxsatlarni yoʻqota olmaydi',
  // Ish haqi sharti (tz.md 15-boʻlim)
  pay: 'Ish haqi',
  pay_title: (name: string) => `Ish haqi sharti — ${name}`,
  pay_hint:
    'Oylik har oy qoʻshiladi. Foiz — shifokor qilgan ish narxidan ulushi. Ikkalasi birga boʻlishi mumkin.',
  salary: 'Oylik (soʻm)',
  percent: 'Foiz (%)',
  pay_none: 'Belgilanmagan',
  pay_optional_hint: 'Keyin ham oʻzgartirish mumkin',
  // Oʻz parolini almashtirish
  change_password: 'Parolni almashtirish',
  current_password: 'Joriy parol',
  new_password: 'Yangi parol',
  password_changed: 'Parol almashtirildi',
} as const

/// Ruxsat nomlari — matritsada shu matn koʻrinadi
export const PERMISSION_LABELS = {
  'patients.read': 'Bemorlarni koʻrish',
  'patients.write': 'Bemorlarni oʻzgartirish',
  'patients.all': 'Hamma bemorlar va tashriflar',
  'visits.write': 'Tashrif yozish',
  'teeth.write': 'Tish xaritasi',
  'payments.read': 'Toʻlovlar va qarzdorlik',
  'payments.write': 'Toʻlov qabul qilish',
  'schedule.write': 'Qabul jadvali',
  'schedule.all': 'Jadval: hamma shifokorning qabullari',
  'services.manage': 'Xizmatlar',
  'expenses.read': 'Xarajatlar',
  'reports.read': 'Hisobotlar',
  'lab.own': 'Oʻz naryadlari',
  'lab.write': 'Naryad yozish',
  'lab.cost': 'Texnik narxlari',
  'payroll.own': 'Oʻz ish haqi',
  'payroll.manage': 'Ish haqi: hamma xodim, toʻlab berish',
  'queue.manage': 'Navbat',
  'feedback.read': 'Bemor fikrlari: hammasi',
  'feedback.own': 'Bemor fikrlari: oʻzi haqida',
  'staff.manage': 'Xodimlar va rollar',
  'billing.manage': 'Obuna va toʻlov',
  'data.export': 'Maʼlumotni yuklab olish',
} as const

// Naryad (texnik ishlari)
export const LAB_TEXT = {
  not_found: 'Naryad topilmadi',
  teeth_required: 'Kamida bitta tish tanlansin',
  tooth_invalid: 'Bunday tish raqami yoʻq',
  due_required: 'Muddat kiritilishi shart',
  shade_invalid: 'Bunday rang yoʻq',
  price_negative: 'Narx manfiy boʻlishi mumkin emas',
  tech_not_found: 'Texnik topilmadi',
  reason_required: 'Qaytarish sababini tanlang',
  status_flow: 'Naryad bu holatga bu bosqichdan oʻta olmaydi',
  not_your_order: 'Bu naryad sizga biriktirilmagan',
  return_from_ready: 'Faqat «Tayyor» naryadni qaytarish mumkin',
  /// Naryad topshirilganda xarajatlarga shu izoh bilan tushadi
  expense_note: (work: string, fio: string) => `${work} — ${fio}`,
} as const

export const LAB_WORK_TYPE_LABELS = {
  crown: 'Koronka',
  bridge: 'Koʻprik',
  denture: 'Olinadigan protez',
  clasp_denture: 'Bugel',
  veneer: 'Vinir',
  inlay: 'Inley/onley',
  mouthguard: 'Kappa',
  ortho_plate: 'Ortodontik plastinka',
} as const

export const LAB_MATERIAL_LABELS = {
  metal_ceramic: 'Metall-keramika',
  zirconia: 'Sirkoniy',
  press_ceramic: 'Press-keramika',
  acrylic: 'Plastmassa',
  cast_metal: 'Quyma metall',
  nylon: 'Neylon',
} as const

export const LAB_STATUS_LABELS = {
  issued: 'Berildi',
  ready: 'Tayyor',
  delivered: 'Topshirildi',
} as const

export const LAB_RETURN_REASON_LABELS = {
  fit: 'Oʻlchov mos emas',
  shade: 'Rang mos emas',
  broken: 'Sindi',
  other: 'Boshqa',
} as const

/// VITA Classical shkalasi
export const VITA_SHADES = [
  'A1',
  'A2',
  'A3',
  'A3.5',
  'A4',
  'B1',
  'B2',
  'B3',
  'B4',
  'C1',
  'C2',
  'C3',
  'C4',
  'D2',
  'D3',
  'D4',
] as const

// «Texnik ishlari» sahifasi
export const LAB_UI = {
  title: 'Texnik ishlari',
  add: 'Yangi naryad',
  edit: 'Naryadni tahrirlash',
  empty: 'Naryadlar yoʻq',
  tab: 'Texnik ishlari',
  empty_patient: 'Bu bemorga naryad yozilmagan',
  patient: 'Bemor',
  doctor: 'Shifokor',
  tech: 'Texnik',
  tech_none: 'Tanlanmagan',
  teeth: 'Tishlar',
  work_type: 'Ish turi',
  material: 'Material',
  shade: 'Rang',
  due: 'Muddat',
  tech_price: 'Texnik narxi',
  status: 'Holat',
  note: 'Izoh',
  overdue: 'Muddati oʻtgan',
  returns: (n: number) => `${n} marta qaytgan`,
  mark_ready: 'Tayyor',
  mark_delivered: 'Topshirildi',
  // Topshirish = tashrif yozish (qaror 19/09/2026)
  deliver_title: 'Ishni topshirish — tashrif',
  deliver_hint: (labCost: string) =>
    `Bemor narxi bugungi sana bilan tashrif sifatida yoziladi. Texnik narxi (${labCost}) shifokor ulushidan ayiriladi.`,
  deliver_submit: 'Topshirish va tashrif yozish',
  deliver_without_visit: 'Tashrifsiz topshirish',
  deliver_without_visit_hint: 'Tashrif avvalroq yozilgan boʻlsa (masalan, oldindan toʻlovda)',
  mark_returned: 'Qaytarish',
  return_title: 'Naryadni qaytarish',
  return_reason: 'Sababi',
  return_note: 'Izoh',
  returned_at: 'Qaytarilgan',
  filter_status: 'Holat boʻyicha',
  filter_tech: 'Texnik boʻyicha',
  filter_all: 'Hammasi',
  delete_title: 'Naryad oʻchirilsinmi?',
  delete_text: 'Bu amalni qaytarib boʻlmaydi.',
} as const

// Toʻliq eksport: fayl nomlari va ustun sarlavhalari
export const EXPORT_FILES = {
  archive: (stamp: string) => `e-dentist-malumot-${stamp}.zip`,
  patients: 'bemorlar.xlsx',
  visits: 'tashriflar.xlsx',
  teeth: 'tish-xaritasi.xlsx',
  payments: 'tolovlar.xlsx',
  appointments: 'qabullar.xlsx',
  expenses: 'xarajatlar.xlsx',
  lab: 'naryadlar.xlsx',
  services: 'xizmatlar.xlsx',
  payroll: 'ish-haqi.xlsx',
  feedback: 'fikrlar.xlsx',
  readme: 'malumot.txt',
} as const

export const EXPORT_COLUMNS = {
  patient: 'Bemor',
  date: 'Sana',
  time: 'Vaqt',
  treatment: 'Muolaja',
  tooth: 'Tish',
  price: 'Narx',
  note: 'Izoh',
  status: 'Holat',
  material: 'Material',
  teeth: 'Tishlar',
  amount: 'Summa',
  category: 'Turkumi',
  service: 'Xizmat',
  service_type: 'Turi',
  work_type: 'Ish turi',
  shade: 'Rang',
  due: 'Muddat',
  tech: 'Texnik',
  doctor: 'Shifokor',
  tech_price: 'Texnik narxi',
  returns: 'Qaytishlar',
  bridge: 'Koʻprik',
  // ish-haqi.xlsx
  month: 'Oy',
  staff: 'Xodim',
  role: 'Rol',
  visits: 'Tashriflar',
  charges: 'Ish summasi',
  percent: 'Foiz',
  share: 'Ulush',
  salary: 'Oylik',
  total: 'Jami',
  paid: 'Toʻlangan',
  remaining: 'Qoldiq',
  // tolovlar.xlsx: bekor qilingan toʻlovlar ham chiqadi, belgisi bilan
  received_by: 'Qabul qildi',
  cancelled: 'Bekor qilingan',
  cancel_reason: 'Bekor sababi',
  // fikrlar.xlsx
  rating: 'Baho',
  tags: 'Teglar',
  phone: 'Telefon',
  source: 'Qayerdan',
} as const

export const EXPORT_UI = {
  title: 'Maʼlumot',
  tab: 'Maʼlumot',
  hint: 'Klinikaning barcha maʼlumoti Excel fayllari koʻrinishida bitta arxivda yuklab olinadi. Rasmlar bemor kartochkasidan alohida yuklab olinadi.',
  download: 'Barcha maʼlumotni yuklab olish',
  preparing: 'Tayyorlanmoqda…',
  readme: (clinic: string, date: string) =>
    [
      `Klinika: ${clinic}`,
      `Yuklab olingan sana: ${date}`,
      '',
      'Arxivdagi fayllar Excel (.xlsx) koʻrinishida.',
      'Bemorlar fayli import shabloni bilan bir xil — uni tahrirlab qaytadan yuklash mumkin.',
    ].join('\n'),
} as const

// Navbat (ochiq sahifa va kabinet)
export const QUEUE_TEXT = {
  clinic_not_found: 'Bunday sahifa yoʻq',
  queue_off: 'Bu klinikada navbat yozuvi vaqtincha yopilgan',
  doctor_required: 'Shifokorni tanlang',
  doctor_not_found: 'Shifokor topilmadi',
  name_required: 'Ism-familiyangizni yozing',
  ticket_not_found: 'Navbat yozuvi topilmadi',
  too_many: 'Bu qurilmadan bugun juda koʻp yozuv boʻldi',
  not_in_queue: 'Bu yozuv navbatda emas',
  status_flow: 'Navbat holatini bu bosqichdan oʻzgartirib boʻlmaydi',
  already_in_queue: 'Bu bemor bugun allaqachon navbatda',
} as const

// Ochiq navbat sahifasi
export const QUEUE_UI = {
  title: 'Navbatga yozilish',
  pick_doctor: 'Shifokorni tanlang',
  waiting: (n: number) => `Navbatda ${n} kishi`,
  wait_minutes: (n: number) => `taxminan ${n} daqiqa`,
  no_doctors: 'Hozircha qabul qiluvchi shifokor yoʻq',
  full_name: 'Ism-familiya',
  phone: 'Telefon',
  join: 'Navbatga yozilish',
  your_number: 'Sizning raqamingiz',
  ahead: (n: number) => (n === 0 ? 'Siz birinchisiz' : `Oldingizda ${n} kishi`),
  called: 'Sizni chaqirishmoqda',
  unconfirmed_hint: 'Qabulxona yozuvingizni tasdiqlaguncha kuting',
  finished: 'Navbatingiz yakunlandi',
  screen_now: 'Hozir',
  screen_next: 'Keyingi',
  closed: 'Navbat yopiq',
  // Bosqichli sahifa (12-bosqich)
  step_doctor: 'Shifokor',
  step_name: 'Ism',
  step_number: 'Raqam',
  now_serving: (n: number) => `Hozir qabulda: №${n}`,
  free_now: 'Hozir boʻsh',
  phone_optional: 'Telefon (ixtiyoriy)',
  phone_hint: 'Qabulxona kerak boʻlsa qoʻngʻiroq qiladi',
  change_doctor: 'Boshqa shifokor',
  progress: (ahead: number) => (ahead === 0 ? 'Keyingisi sizsiz' : `Oldingizda ${ahead} kishi`),
  keep_open: 'Sahifani yopmang — navbatingiz kelganda shu yerda koʻrasiz',
  call: 'Qoʻngʻiroq',
  route: 'Manzil',
  leave_feedback: 'Fikr bildirish',
  feedback_prompt: 'Qabul qanday oʻtdi?',
  feedback_prompt_hint: 'Bir daqiqa — bahoyingiz klinikaga yordam beradi',
  feedback_done: 'Fikringiz uchun rahmat',
  join_again: 'Yana yozilish',
} as const

// Bemor fikri — ochiq sahifa (/f/<kod>)
export const FEEDBACK_UI = {
  title: 'Fikr bildirish',
  subtitle: 'Bahoyingiz faqat klinika rahbariga koʻrinadi',
  rating: 'Klinikaga bahoyingiz',
  rating_labels: ['Juda yomon', 'Yomon', 'Oʻrtacha', 'Yaxshi', 'Aʼlo'] as const,
  doctor: 'Qaysi shifokor qabul qildi?',
  doctor_any: 'Aytmayman',
  tags_good: 'Nima yoqdi?',
  tags_bad: 'Nima yoqmadi?',
  comment: 'Izoh',
  comment_placeholder: 'Xohlasangiz batafsil yozing…',
  phone: 'Telefon',
  phone_hint: 'Rahbariyat siz bilan bogʻlanishini xohlasangiz qoldiring',
  send: 'Yuborish',
  thanks: 'Rahmat!',
  thanks_hint: 'Fikringiz klinika rahbariga yetkazildi',
  thanks_low: 'Kechirim soʻraymiz. Rahbariyat albatta koʻrib chiqadi',
  review_cta: 'Xaritada ham baholang',
  review_hint:
    'Sizga yoqqan boʻlsa — Google yoki Yandex xaritada ham bir ogʻiz yozing, boshqalarga yordam beradi',
  back_to_queue: 'Navbat sahifasiga',
} as const

export const FEEDBACK_TAG_LABELS = {
  waiting: 'Kutish vaqti',
  attitude: 'Muomala',
  treatment: 'Davolash',
  cleanliness: 'Tozalik',
  price: 'Narx',
} as const

export const FEEDBACK_STATUS_LABELS = {
  new: 'Yangi',
  seen: 'Koʻrildi',
  contacted: 'Bogʻlanildi',
} as const

export const FEEDBACK_SOURCE_LABELS = {
  ticket: 'Navbatdan',
  qr: 'QR varaqdan',
  page: 'Sahifadan',
} as const

// Server xatolari
export const FEEDBACK_TEXT = {
  rating_required: '1 dan 5 gacha baho bering',
  too_many: 'Bu qurilmadan bugun juda koʻp fikr yuborildi',
  ticket_not_finished: 'Fikr qabul tugagach yoziladi',
  ticket_already: 'Bu navbat raqamiga fikr allaqachon yozilgan',
  not_found: 'Fikr topilmadi',
  bad_url: 'Havola http:// yoki https:// bilan boshlansin',
} as const

// Kabinetdagi fikrlar (Sozlamalar → Fikrlar) va bosh sahifa kartasi
export const FEEDBACK_CABINET_UI = {
  tab: 'Fikrlar',
  hint: 'Bemorlarning klinika va shifokorlar haqidagi bahosi',
  empty: 'Hali fikr yoʻq',
  empty_hint:
    'Fikr QR varagʻini chop etib chiqish eshigiga osing — bemorlar bahosi shu yerga tushadi',
  average: 'Oʻrtacha baho',
  count: (n: number) => `${n} ta fikr`,
  new_count: (n: number) => `${n} ta yangi`,
  all: 'Hammasi',
  only_new: 'Faqat yangi',
  low_only: 'Past baho (1–2)',
  doctor_filter: 'Shifokor',
  no_doctor: 'Shifokor koʻrsatilmagan',
  anonymous: 'Ismsiz',
  mark_seen: 'Koʻrildi',
  mark_contacted: 'Bogʻlanildi',
  patient_card: 'Kartochka',
  nothing_found: 'Bu filtrda fikr yoʻq',
  by_doctor: 'Shifokorlar boʻyicha',
  period_month: 'Shu oy',
  period_all: 'Hammasi',
  home_title: 'Bemorlar bahosi',
  home_hint: (count: number, fresh: number) =>
    fresh > 0 ? `${count} ta fikr · ${fresh} ta yangi` : `${count} ta fikr`,
  home_empty: 'Hali fikr yoʻq',
  // Sozlamalar
  settings_title: 'Bemor sahifasi',
  public_phone: 'Bemorlar uchun telefon',
  public_phone_hint: 'Navbat sahifasida «Qoʻngʻiroq» tugmasi shu raqamga',
  address: 'Manzil',
  address_hint: 'Navbat sahifasida koʻrinadi',
  review_url: 'Xaritadagi sharh havolasi',
  review_url_hint:
    'Google yoki Yandex xaritadagi klinika sahifangiz. 5 yulduz bergan bemorga «xaritada ham baholang» tugmasi chiqadi',
  saved: 'Saqlandi',
  // Fikr QR varagʻi
  poster: 'Fikr QR varagʻi',
  poster_hint: 'Chiqish eshigiga yoki har shifokor xonasiga — shifokor tanlab chop etiladi',
  poster_doctor: 'Shifokor xonasi uchun',
  poster_general: 'Umumiy (chiqish eshigi)',
  poster_title: 'Fikringiz biz uchun muhim',
  poster_scan: 'QR ni skanerlang va bir daqiqada baholang',
  poster_steps: 'Yulduz qoʻying, xohlasangiz izoh yozing. Ism shart emas.',
  poster_print: 'Chop etish',
} as const

// Kabinetdagi navbat
export const QUEUE_CABINET_UI = {
  title: 'Navbat',
  // Kabinetdan navbatga qoʻshish (10.3)
  enqueue: 'Navbatga qoʻshish',
  enqueue_title: (name: string) => `Navbatga qoʻshish — ${name}`,
  enqueue_hint: 'Bemor bugungi navbatga tanlangan shifokorga tushadi, tasdiqlash shart emas.',
  enqueue_on_create: 'Bugun navbatga qoʻshish',
  enqueue_needs_doctor: 'Navbatga qoʻshish uchun shifokorni tanlang',
  empty: 'Bugun navbat boʻsh',
  number: 'Raqam',
  patient: 'Bemor',
  doctor: 'Shifokor',
  status: 'Holat',
  joined_at: 'Yozilgan',
  confirm: 'Tasdiqlash',
  call: 'Chaqirish',
  arrived: 'Keldi',
  no_show: 'Kelmadi',
  done: 'Yakunlandi',
  new_patient: 'Roʻyxatda yoʻq',
  link: 'Kartochka',
  empty_column: 'Boʻsh',
  screen_link: 'Kutish xonasi ekrani',
  page_link: 'Bemor sahifasi',
  code_hint: 'Eshikdagi QR shu manzilga olib boradi',
  settings_tab: 'Navbat',
  enabled: 'Navbat yozuvi ochiq',
  enabled_hint:
    'Oʻchirilsa ochiq sahifa ham, kutish xonasi ekrani ham yopiladi. Kabinetdagi roʻyxat joyida qoladi.',
  address: 'Sahifa manzili',
  copy: 'Nusxalash',
  copied: 'Nusxalandi',
  // Eshikka osiladigan QR (10.8)
  qr: 'QR kod',
  qr_hint: 'Telefon kamerasi bilan skanerlab tekshiring — shu manzilga olib boradi',
  poster: 'Chop etish — A4 varaq',
  poster_scan: 'Telefon kamerasini QR kodga tuting',
  poster_steps:
    'Shifokorni tanlang, ismingizni yozing — navbat raqamini olasiz. Ilova oʻrnatish shart emas.',
  poster_disabled:
    'Navbat yozuvi hozir yopiq — bu varaq ishlamaydi. Sozlamalar → Navbat boʻlimida yoqing.',
  poster_print: 'Chop etish',
  poster_back: 'Sozlamalarga qaytish',
} as const

/// Navbat holatlari — kabinetda koʻrinadigan nomlar
export const QUEUE_STATUS_LABELS = {
  unconfirmed: 'Tasdiqlanmagan',
  waiting: 'Kutmoqda',
  called: 'Chaqirildi',
  finished: 'Yakunlandi',
} as const

// Obuna va muddat
export const BILLING_TEXT = {
  expired:
    'Obuna muddati tugagan — hozircha faqat oʻqish mumkin. Maʼlumotingiz joyida, muddatni uzaytirsangiz yozish yana ochiladi',
  blocked: 'Klinika bloklangan. Batafsil maʼlumot uchun bogʻlaning',
} as const

// Boshqaruv paneli (apps/admin)
export const ADMIN_UI = {
  brand: 'E-Dentist — boshqaruv',
  login_title: 'Boshqaruv paneli',
  login_hint: 'Faqat platforma admini uchun',
  clinics: 'Klinikalar',
  stats: 'Statistika',
  soon: 'Bu boʻlim keyingi taskda toʻldiriladi',
  not_admin: 'Bu hisob boshqaruv paneliga kira olmaydi',
  search: 'Nom yoki telefon boʻyicha qidirish',
  empty: 'Klinika topilmadi',
  clinic: 'Klinika',
  plan: 'Tarif',
  expires: 'Muddat',
  staff: 'Xodimlar',
  patients_count: 'Bemorlar',
  visits_count: 'Tashriflar',
  last_login: 'Oxirgi kirish',
  created: 'Roʻyxatdan oʻtgan',
  trial: 'Sinov',
  expired: 'Muddati oʻtgan',
  blocked: 'Bloklangan',
  active: 'Faol',
  new_clinic: 'Yangi klinika',
  new_clinic_hint: 'Egasining pochtasiga parol belgilash havolasi yuboriladi',
  owner_email: 'Egasining pochtasi',
  trial_days: 'Sinov muddati (kun)',
  create: 'Ochish',
  invite_pending: 'Taklif yuborilgan',
  invite_resend: 'Taklifnomani qayta yuborish',
  invite_sent_at: (date: string) => `Taklifnoma ${date} da yuborilgan`,
  extend: 'Muddatni uzaytirish',
  extend_days: (n: number) => `+${n} kun`,
  block: 'Bloklash',
  unblock: 'Blokdan chiqarish',
  history: 'Tarix',
  never: 'hech qachon',
  back: 'Klinikalar',
  theme_light: 'Yorugʻ rejim',
  theme_dark: 'Tungi rejim',
  menu_toggle: 'Menyu',
  queue_on: 'Navbat yoqilgan',
  queue_off: 'Navbat oʻchirilgan',
  total: 'Jami klinika',
  active_clinics: 'Faol',
  trial_clinics: 'Sinovda',
  expired_clinics: 'Muddati oʻtgan',
  blocked_clinics: 'Bloklangan',
  staff_total: 'Xodimlar',
  staff_member: 'Xodim',
  stats_hint: 'Platforma boʻyicha koʻrsatkichlar va oxirgi hodisalar',
  clinics_hint: 'Roʻyxatdan oʻtgan klinikalar, muddatlari va holati',
  monthly: 'Oylar kesimi',
  monthly_hint: 'Oxirgi 12 oy',
  registered_month: 'Roʻyxatdan oʻtgan',
  extended_month: 'Uzaytirilgan',
  revenue_pending: 'Daromad hisobi narx modeli belgilangach qoʻshiladi',
  events: 'Hodisalar',
  events_all: 'Klinika amallari bilan',
  events_platform: 'Faqat platforma hodisalari',
  event_time: 'Vaqt',
  event_action: 'Amal',
  event_who: 'Kim',
} as const

/// Tarixdagi amallar — panelda koʻrinadigan nomlar.
/// Roʻyxat `platform/audit.ts` dagi AUDIT_ACTION bilan bir xil boʻlishi kerak
export const AUDIT_LABELS = {
  registered: 'Roʻyxatdan oʻtdi',
  clinic_created: 'Klinika panelidan ochildi',
  invite_sent: 'Taklifnoma yuborildi',
  invite_accepted: 'Taklifnoma qabul qilindi',
  clinic_logo_changed: 'Logotip oʻzgardi',
  email_verified: 'Pochta tasdiqlandi',
  logged_in: 'Kirdi',
  login_failed: 'Kirish urinishi rad etildi',
  logged_out: 'Chiqdi',
  role_changed: 'Rol oʻzgardi',
  staff_changed: 'Xodim oʻzgardi',
  patient_created: 'Bemor qoʻshildi',
  patient_updated: 'Bemor tahrirlandi',
  patient_deleted: 'Bemor oʻchirildi',
  patient_viewed: 'Bemor kartochkasi ochildi',
  visit_created: 'Tashrif yozildi',
  visit_updated: 'Tashrif tahrirlandi',
  visit_deleted: 'Tashrif oʻchirildi',
  tooth_updated: 'Tish xaritasi oʻzgardi',
  bridge_created: 'Koʻprik qoʻshildi',
  bridge_deleted: 'Koʻprik oʻchirildi',
  image_uploaded: 'Rasm yuklandi',
  image_deleted: 'Rasm oʻchirildi',
  payment_created: 'Toʻlov qabul qilindi',
  payment_updated: 'Toʻlov tahrirlandi',
  payment_deleted: 'Toʻlov oʻchirildi',
  payment_cancelled: 'Toʻlov bekor qilindi',
  service_changed: 'Xizmatlar oʻzgardi',
  patients_exported: 'Bemorlar Excelga chiqarildi',
  patients_imported: 'Bemorlar Exceldan yuklandi',
  appointment_changed: 'Qabul oʻzgardi',
  expense_changed: 'Xarajat oʻzgardi',
  lab_created: 'Naryad yozildi',
  lab_updated: 'Naryad tahrirlandi',
  lab_deleted: 'Naryad oʻchirildi',
  lab_status_changed: 'Naryad holati oʻzgardi',
  lab_returned: 'Naryad qaytarildi',
  data_exported: 'Maʼlumot yuklab olindi',
  queue_changed: 'Navbat oʻzgardi',
  payroll_recalculated: 'Ish haqi qayta hisoblandi',
  payout_created: 'Ish haqi toʻlandi',
  payout_deleted: 'Ish haqi toʻlovi oʻchirildi',
  subscription_extended: 'Muddat uzaytirildi',
  clinic_blocked: 'Bloklandi',
  clinic_unblocked: 'Blokdan chiqarildi',
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

// Jadval: saralash, ustunlar, sahifalash
export const TABLE_UI = {
  sort_asc: 'Oʻsish boʻyicha',
  sort_desc: 'Kamayish boʻyicha',
  hide_column: 'Ustunni yashirish',
  columns: 'Ustunlar',
  reset: 'Tozalash',
  rows_per_page: 'Sahifada',
  page_of: (page: number, total: number) => `${page}-sahifa, jami ${total}`,
  first_page: 'Birinchi sahifa',
  prev_page: 'Oldingi sahifa',
  next_page: 'Keyingi sahifa',
  last_page: 'Oxirgi sahifa',
  actions: 'Amallar',
  no_results: 'Hech narsa topilmadi',
  filter_search: 'Qidirish…',
  filter_clear: 'Filtrni tozalash',
  filter_all: 'Hammasi',
  range_from: 'dan',
  range_to: 'gacha',
  selected: (n: number) => `${n} ta tanlangan`,
} as const

// Sozlamalar sahifasi: chap navigatsiya va har boʻlimning tavsifi
export const SETTINGS_UI = {
  title: 'Sozlamalar',
  hint: 'Hisobingiz, xodimlar, rollar va klinika sozlamalari',
  account_hint: 'Ismingiz, pochtangiz va parolingiz',
  staff_hint: 'Xodimlar hisoblari va ularning rollari',
  roles_hint: 'Har rol nimani koʻradi va nimani oʻzgartira oladi',
  clinic_hint: 'Logotip va klinika koʻrinishi',
  queue_hint: 'Bemorlar uchun navbat sahifasi va kutish xonasi ekrani',
  feedback_hint: 'Bemorlarning bahosi, fikr QR varagʻi va bemor sahifasi kontaktlari',
  data_hint: 'Barcha maʼlumotni yuklab olish',
} as const

// Telefondagi pastki dok (Liquid Glass) va «Yana» varagʻi
export const DOCK_UI = {
  more: 'Yana',
  // Dok tabida qisqa nom: toʻrt tab 300px ga sigʻishi kerak
  short: {
    '/': 'Asosiy',
    '/schedule': 'Jadval',
    '/lab': 'Naryadlar',
    '/debtors': 'Qarzlar',
    '/reports': 'Hisobot',
  } as Record<string, string>,
  search: 'Boʻlim qidirish…',
  nothing: 'Topilmadi',
  queue_waiting: (n: number) => `Navbatda ${n} kishi`,
  lab_ready: (n: number) => `${n} ta tayyor`,
  feedback_new: (n: number) => `${n} ta yangi`,
} as const

// Davr tanlovi: kun · hafta · oy · yil (xarajatlar, hisobotlar)
export const PERIOD_UI = {
  kinds: { day: 'Kun', week: 'Hafta', month: 'Oy', year: 'Yil' },
  current: { day: 'Bugun', week: 'Shu hafta', month: 'Shu oy', year: 'Shu yil' },
  prev: 'Oldingi davr',
  next: 'Keyingi davr',
} as const

// Klinika logotipi
export const LOGO_UI = {
  tab: 'Klinika',
  title: 'Logotip',
  hint: 'Yon menyuda, navbat sahifasida va kutish xonasi ekranida koʻrinadi',
  requirements: 'PNG, JPG yoki WEBP · eng koʻpi 2 MB',
  empty: 'Logotip qoʻyilmagan',
  choose: 'Rasm tanlash',
  replace: 'Almashtirish',
  remove: 'Oʻchirish',
  uploading: 'Yuklanmoqda…',
  confirm_remove: 'Logotip oʻchirilsinmi?',
} as const

// Taklifnoma: panel klinika ochganda egasi shu havola orqali parol qoʻyadi
export const INVITE_TEXT = {
  subject: 'E-Dentist — klinikangiz uchun hisob',
  link_invalid: 'Havola notoʻgʻri yoki muddati oʻtgan',
  link_used: 'Bu havola allaqachon ishlatilgan — hisobingizga kiring',
  email_taken: 'Bu pochta bilan hisob allaqachon mavjud',
  expired_days: (days: number) => `Havola ${days} kun amal qiladi.`,
} as const

export const INVITE_UI = {
  title: 'Hisobingizni oching',
  hint: (clinic: string) => `«${clinic}» uchun parol belgilang`,
  full_name: 'Ism-familiyangiz',
  password: 'Yangi parol',
  password_again: 'Parolni takrorlang',
  password_mismatch: 'Parollar mos kelmadi',
  submit: 'Hisobni ochish',
  checking: 'Havola tekshirilmoqda…',
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
  already_done: 'Bu qabul allaqachon yakunlangan',
  done_needs_visit: 'Yakunlash uchun qilingan ishni yozing — «Yakunlandi» tashrif orqali qoʻyiladi',
  duration_invalid: 'Davomiylik 5 daqiqadan 8 soatgacha, 5 daqiqa qadam bilan',
  slot_busy: (range: string, fio: string) => `Bu vaqt band: ${range} — ${fio}`,
  // Shifokorning band vaqti
  block_not_found: 'Band vaqt topilmadi',
  block_range: 'Tugash vaqti boshlanishdan keyin boʻlishi kerak',
  block_doctor_required: 'Shifokorni tanlang',
  block_has_appointments: (n: number) =>
    `Bu oraliqda ${n} ta qabul bor — avval ularni koʻchiring yoki bekor qiling`,
  doctor_away: (range: string, reason: string) =>
    `Shifokor bu vaqtda yoʻq: ${range}${reason ? ` (${reason})` : ''}`,
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
  day_total: (n: number) => `${n} ta`,
  set_status: 'Holatni oʻzgartirish',
  open_card: 'Kartochka',
  date_unreadable: 'Sanani oʻqib boʻlmadi',
  doctor: 'Shifokor',
  doctor_none: 'Shifokorsiz',
  all_doctors: 'Hamma shifokorlar',
  // Yakunlash = tashrif yozish (10.6)
  complete: 'Qabulni yakunlash',
  complete_hint: (date: string) =>
    `Qilingan ish ${date} sanasidagi tashrif sifatida bemor kartochkasiga tushadi, qabul «Yakunlandi» boʻladi.`,
  complete_submit: 'Yakunlash',
  // Vaqt toʻri (kun/hafta) va davomiylik (12-bosqich)
  view_day: 'Kun',
  view_week: 'Hafta',
  view_month: 'Oy',
  duration: 'Davomiylik',
  minutes: (n: number) => `${n} daq`,
  // Vaqt tanlash — soat × chorak toʻri
  time_unset: 'Vaqt tanlanmagan',
  time_hint: 'Katakni bosing — boshlanish',
  busy_needs_doctor: 'Shifokor tanlansa band vaqtlari koʻrinadi',
  manual: 'Qoʻlda',
  legend_new: 'Yangi qabul',
  legend_busy: 'Band',
  overlap: 'Band vaqt bilan kesishadi',
  new_patient: 'Yangi bemor',
  new_patient_hint: 'Bemorlar roʻyxatiga qoʻshiladi',
  existing_patient: 'Mavjud bemorni tanlash',
  // Shifokorning band vaqti
  block: 'Band vaqt',
  block_add: 'Band vaqt qoʻshish',
  block_edit: 'Band vaqtni tahrirlash',
  block_hint: 'Bu oraliqqa qabul yozilmaydi: tushlik, oʻqish, taʼtil',
  block_from: 'Dan',
  block_to: 'Gacha',
  block_all_day: 'Butun kun',
  block_reason: 'Sabab',
  block_reason_placeholder: 'Tushlik, oʻqish, taʼtil…',
  block_delete_title: 'Band vaqt oʻchirilsinmi?',
  block_default: 'Band',
  week_total: (n: number) => `${n} ta qabul`,
  now: 'Hozir',
} as const

// Sana formati uchun. `format.ts` shulardan oladi
export const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
] as const

/// Grafik oʻqi uchun qisqartma
export const MONTHS_SHORT = [
  'yan',
  'fev',
  'mar',
  'apr',
  'may',
  'iyn',
  'iyl',
  'avg',
  'sen',
  'okt',
  'noy',
  'dek',
] as const

export const WEEKDAYS = ['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Shan', 'Yak'] as const
