// Modullar orasida umumiy tiplar.

// --- API javob shakli ---
// Hamma joyda bir xil. Mavjud oflayn ilovadagi {ok, data|error} qoidasining davomi.

export const XATO_KODLARI = [
  'bad_request',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'validation',
  'rate_limited',
  'subscription_expired',
  'internal',
] as const

export type XatoKodi = (typeof XATO_KODLARI)[number]

export interface ApiOk<T> {
  ok: true
  data: T
}

export interface ApiXato {
  ok: false
  error: {
    code: XatoKodi
    message: string
    // Forma tekshiruvida: maydon nomi → oʻzbekcha xato matni
    fields?: Record<string, string>
  }
}

export type ApiJavob<T> = ApiOk<T> | ApiXato

// --- Ruxsatlar (tz.md 6, 7 va 14-boʻlim) ---
// Roʻyxat ataylab qisqa. Har boʻlim uchun alohida «koʻrish/qoʻshish/oʻchirish»
// uchligi matritsani uch barobar kattalashtiradi va hech kimga kerak boʻlmaydi.

export const RUXSATLAR = [
  'patients.read',
  'patients.write',
  'visits.write',
  'teeth.write',
  'payments.read',
  'payments.write',
  'schedule.write',
  'services.manage',
  'expenses.read',
  'reports.read',
  'lab.own',
  'lab.write',
  'lab.cost',
  'staff.manage',
  'billing.manage',
  'data.export',
  'queue.manage',
] as const

export type Ruxsat = (typeof RUXSATLAR)[number]

// --- Rollar ---
// Klinika roʻyxatdan oʻtganda shu beshtasi nusxalanadi va oʻsha klinikaga
// tegishli boʻlib qoladi. Ruxsatlar toʻplami 1.6 dagi seed da beriladi.

export const ROL_SHABLONLARI = ['egasi', 'shifokor', 'qabulxona', 'texnik', 'kuzatuvchi'] as const

export type RolShabloni = (typeof ROL_SHABLONLARI)[number]

// --- Yordamchi tiplar ---

// Sana bazada DATE, API da har doim YYYY-MM-DD matn koʻrinishida
export type IsoSana = string

// Pul har doim butun son — soʻm. Kasr yoʻq, float yoʻq
export type Som = number
