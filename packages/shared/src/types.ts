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
  'patients.all',
  'visits.write',
  'teeth.write',
  'payments.read',
  'payments.write',
  'schedule.write',
  'schedule.all',
  'services.manage',
  'expenses.read',
  'reports.read',
  'lab.own',
  'lab.write',
  'lab.cost',
  'payroll.own',
  'payroll.manage',
  'staff.manage',
  'billing.manage',
  'data.export',
  'queue.manage',
  'feedback.read',
  'feedback.own',
  'plans.read',
  'plans.write',
] as const

// --- Bemor fikrlari ---
// Tez tanlovlar: bemor yulduz bilan birga nimani nazarda tutganini belgilaydi.
// Roʻyxat qatʼiy — statistika shu kalitlar boʻyicha yigʻiladi
export const FEEDBACK_TAGS = ['waiting', 'attitude', 'treatment', 'cleanliness', 'price'] as const
export type FeedbackTag = (typeof FEEDBACK_TAGS)[number]

export const FEEDBACK_SOURCES = ['ticket', 'qr', 'page'] as const
export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number]

export const FEEDBACK_STATUSES = ['new', 'seen', 'contacted'] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

// --- Davolash rejalari (tz.md 18-boʻlim) ---
// Reja oʻchirilmaydi — bekor qilinadi, toʻlovdagi qoida bilan bir xil:
// bemorga koʻrsatilgan narx izsiz yoʻqolmasligi kerak
// --- Xizmatning qoʻllanish sohasi (tz.md 19-boʻlim) ---
// Dastur shunga qarab tish soʻraydi: `tooth` da majburiy, `mouth`/`arch` da
// maydon koʻrsatilmaydi. `range` (koʻprik) — oraliq 15.2 da
export const SERVICE_AREAS = ['tooth', 'range', 'arch', 'mouth'] as const
export type ServiceArea = (typeof SERVICE_AREAS)[number]

/// Soha tish soʻraydimi
export function areaNeedsTooth(area: ServiceArea): boolean {
  return area === 'tooth' || area === 'range'
}

export const PLAN_STATUSES = ['draft', 'sent', 'accepted', 'declined', 'done', 'cancelled'] as const
export type PlanStatus = (typeof PLAN_STATUSES)[number]

// Band «bajarildi» boʻlishi uchun tashrif yoziladi (13.4) — qoʻlda faqat
// «oʻtkazib yuborildi» ga oʻtkaziladi
export const PLAN_ITEM_STATUSES = ['pending', 'done', 'skipped'] as const
export type PlanItemStatus = (typeof PLAN_ITEM_STATUSES)[number]

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
