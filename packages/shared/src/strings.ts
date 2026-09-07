// Barcha oʻzbekcha matnlar shu faylda. Kodda matn qatorlari yozilmaydi —
// rus tili keyin qoʻshilsa shu fayl nusxalanadi, qolgan kodga tegilmaydi.

// Xato kodi → foydalanuvchi koʻradigan matn.
// Texnik tafsilot javobga tushmaydi, faqat logga yoziladi.
export const XATO_MATNI = {
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
export const TEKSHIRUV = {
  fio_shart: 'F.I.O. kiritilishi shart',
  fio_qisqa: 'Kamida 3 ta harf kiriting',
  fio_harf: 'Ismda faqat harflar boʻlishi mumkin',
  telefon_toliq_emas: 'Raqam toʻliq emas: +998 XX XXX XX XX',
  sana_notogri: 'Sana notoʻgʻri',
  sana_kelajak: 'Sana kelajakda boʻlishi mumkin emas',
  sana_qadimgi: 'Sana juda qadimgi',
} as const

// Qiymat yoʻqligini bildiruvchi belgi — jadvallarda boʻsh katak oʻrniga
export const BELGI_YOQ = '—'

// Pul birligi. Diqqat: «ʻ» — U+02BB, oddiy apostrof emas
export const PUL_BIRLIGI = 'soʻm'

// Rol shablonlarining koʻrinadigan nomlari
export const ROL_NOMI = {
  egasi: 'Egasi',
  shifokor: 'Shifokor',
  qabulxona: 'Qabulxona',
  texnik: 'Texnik',
  kuzatuvchi: 'Kuzatuvchi',
} as const

// Kirish va roʻyxatdan oʻtish
export const AUTH = {
  klinika_nomi_qisqa: 'Klinika nomi kamida 2 belgi boʻlsin',
  fio_qisqa: 'Ism-familiyani toʻliq yozing',
  email_notogri: 'Pochta manzili notoʻgʻri yozilgan',
  parol_qisqa: 'Parol kamida 8 belgidan iborat boʻlsin',
  parol_uzun: 'Parol juda uzun',
  telefon_notogri: 'Telefon raqami toʻliq emas',
  email_band: 'Bu pochta manzili allaqachon roʻyxatdan oʻtgan',
  // Ataylab umumiy: pochta bor-yoʻqligini oshkor qilmaydi
  kirish_xato: 'Pochta yoki parol notoʻgʻri',
  hisob_faolsiz: 'Hisobingiz faolsizlantirilgan. Klinika egasiga murojaat qiling',
  pochta_tasdiqlanmagan: 'Avval pochtangizni tasdiqlang — havola xatingizga yuborilgan',
  havola_yaroqsiz: 'Havola yaroqsiz yoki muddati oʻtgan',
  bir_martalik_pochta: 'Bir martalik pochta xizmatlari qabul qilinmaydi',
  kop_urinish: 'Juda koʻp urinish boʻldi. Bir necha daqiqadan keyin qayta urinib koʻring',
  kop_royxat: 'Bugun bu qurilmadan juda koʻp roʻyxatdan oʻtish boʻldi. Ertaga urinib koʻring',
  xat_mavzusi: 'E-Dentist — pochtangizni tasdiqlang',
} as const

// Kabinet interfeysi
export const KABINET = {
  brend: 'E-Dentist',
  aloqa_yoq: 'Server bilan aloqa yoʻq. Internetni tekshirib, qayta urinib koʻring',
  kirish: 'Kirish',
  chiqish: 'Chiqish',
  royxatdan_otish: 'Roʻyxatdan oʻtish',
  pochta: 'Pochta',
  parol: 'Parol',
  klinika_nomi: 'Klinika nomi',
  telefon: 'Telefon',
  fio: 'Ism-familiya',
  hisobingiz_bormi: 'Hisobingiz bormi?',
  hisobingiz_yoqmi: 'Hisobingiz yoʻqmi?',
  yuborilmoqda: 'Yuborilmoqda…',
  yuklanmoqda: 'Yuklanmoqda…',
  xat_yuborildi: 'Pochtangizga tasdiqlash havolasi yuborildi',
  xat_yuborildi_izoh:
    'Xatni ochib havolani bosing. Xat koʻrinmasa, «Spam» papkasini ham tekshiring.',
  tasdiqlanmoqda: 'Tasdiqlanmoqda…',
  tasdiqlandi: 'Pochta tasdiqlandi',
  tasdiqlandi_izoh: 'Endi hisobingizga kira olasiz.',
  sinov_qoldi: (kun: number) => `Sinov muddati: ${kun} kun qoldi`,
  sinov_tugadi: 'Sinov muddati tugadi — faqat oʻqish rejimi',
  bolim_tayyorlanmoqda: 'Bu boʻlim keyingi bosqichda qoʻshiladi',
  bolim_yoq: 'Bu boʻlimga ruxsatingiz yoʻq',
  xush_kelibsiz: 'Xush kelibsiz',
  bosh_sahifa_izoh:
    'Kabinet tayyor. Bemorlar, tashriflar va tish xaritasi keyingi bosqichda qoʻshiladi.',
} as const

// Yon menyu boʻlimlari. Har biri talab qiladigan ruxsat bilan
export const BOLIMLAR = [
  { yol: '/bemorlar', nom: 'Bemorlar', ico: '👥', ruxsat: 'patients.read' },
  { yol: '/qabullar', nom: 'Qabul jadvali', ico: '📅', ruxsat: 'schedule.write' },
  { yol: '/naryadlar', nom: 'Texnik ishlari', ico: '🦷', ruxsat: 'lab.own' },
  { yol: '/qarzdorlar', nom: 'Qarzdorlar', ico: '💳', ruxsat: 'payments.read' },
  { yol: '/narxnoma', nom: 'Narxnoma', ico: '🏷', ruxsat: 'services.manage' },
  { yol: '/xarajatlar', nom: 'Xarajatlar', ico: '🧾', ruxsat: 'expenses.read' },
  { yol: '/hisobotlar', nom: 'Hisobotlar', ico: '📊', ruxsat: 'reports.read' },
  { yol: '/sozlamalar', nom: 'Sozlamalar', ico: '⚙️', ruxsat: 'staff.manage' },
] as const
