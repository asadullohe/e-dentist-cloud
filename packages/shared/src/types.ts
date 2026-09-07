// Modullar orasida umumiy tiplar.

// --- API javob shakli ---
// Hamma joyda bir xil. Mavjud oflayn ilovadagi {ok, data|error} qoidasining davomi.

export const ERROR_CODES = [
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

export type ErrorCode = (typeof ERROR_CODES)[number]

export interface ApiOk<T> {
  ok: true
  data: T
}

export interface ApiErrorResponse {
  ok: false
  error: {
    code: ErrorCode
    message: string
    // Forma tekshiruvida: maydon nomi → oʻzbekcha xato matni
    fields?: Record<string, string>
  }
}

export type ApiResponse<T> = ApiOk<T> | ApiErrorResponse

// --- Ruxsatlar (tz.md 6, 7 va 14-boʻlim) ---
// Roʻyxat ataylab qisqa. Har boʻlim uchun alohida «koʻrish/qoʻshish/oʻchirish»
// uchligi matritsani uch barobar kattalashtiradi va hech kimga kerak boʻlmaydi.

export const PERMISSIONS = [
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

export type Permission = (typeof PERMISSIONS)[number]

// --- Rollar ---
// Klinika roʻyxatdan oʻtganda shu beshtasi nusxalanadi va oʻsha klinikaga
// tegishli boʻlib qoladi. Ruxsatlar toʻplami 1.6 dagi seed da beriladi.

export const ROLE_TEMPLATES = ['egasi', 'shifokor', 'qabulxona', 'texnik', 'kuzatuvchi'] as const

export type RoleTemplate = (typeof ROLE_TEMPLATES)[number]

// --- Yordamchi tiplar ---

// Sana bazada DATE, API da har doim YYYY-MM-DD matn koʻrinishida
export type IsoDate = string

// Pul har doim butun son — soʻm. Kasr yoʻq, float yoʻq
export type Som = number
