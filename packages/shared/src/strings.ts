// Tillar va matnlarga jonli kirish.
//
// Matnlar tilga qarab `locales/` da turadi. Bu fayl ikki narsa beradi:
//
//   1. Til holati: `getLocale()`, `setLocale()`, `strings(locale?)`.
//   2. Jonli eksportlar: `AUTH_TEXT`, `UI_TEXT`, … — ular oddiy obyekt
//      emas, Proxy. `AUTH_TEXT.login` oʻqilganda joriy tildagi qiymat
//      qaytadi. Shuning uchun 80 ta faylda import oʻzgarmadi.
//
// Ehtiyot boʻlinadigan joy: qiymat **import vaqtida** oʻqilsa (masalan
// `label: SECTION_LABELS.patients` modul darajasidagi massivda, yoki zod
// sxemasidagi xato matni), u oʻsha paytdagi tilda muzlab qoladi. Bunday
// joylarda qiymat funksiya ichida oʻqilishi kerak — `() => …` yoki zod da
// `{ error: () => … }`.
//
// Brauzerda til bitta: `setLocale()` bilan almashadi. Serverda har soʻrov
// oʻz tilida — u `setLocaleResolver()` orqali tilni soʻrov kontekstidan
// (AsyncLocalStorage) oʻqiydi; bu fayl Node ga bogʻlanmaydi.

import { ru } from './locales/ru.js'
import * as uz from './locales/uz.js'

export const LOCALES = ['uz', 'ru'] as const
export type Locale = (typeof LOCALES)[number]

/// Tilning oʻz nomi — tanlov roʻyxatida tarjima qilinmaydi
export const LOCALE_LABELS: Record<Locale, string> = {
  uz: 'Oʻzbekcha',
  ru: 'Русский',
}

export const DEFAULT_LOCALE: Locale = 'uz'

/// Matn toʻplamlarining shakli. `uz` dagi literal tiplar kengaytiriladi:
/// boshqa tilda qiymat boshqa satr, lekin kalitlar va funksiya imzolari
/// bir xil boʻlishi shart
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : T extends (...args: infer A) => infer R
      ? (...args: A) => Widen<R>
      : T extends object
        ? { [K in keyof T]: Widen<T[K]> }
        : T

export type Strings = Widen<typeof uz>

/// Tarjima boʻlaklab kiritiladi: yoʻq kalit oʻzbekchaga qaytadi
export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/// Tarjimani asosiy til ustiga qoʻyadi: kalit yoʻq boʻlsa oʻzbekcha qoladi
function merge<T>(base: T, patch: DeepPartial<T> | undefined): T {
  if (patch === undefined) return base
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch as T
  const out: Record<string, unknown> = { ...base }
  for (const key of Object.keys(patch)) {
    out[key] = merge(base[key], (patch as Record<string, unknown>)[key] as never)
  }
  return out as T
}

const catalogs: Record<Locale, Strings> = {
  uz: uz as Strings,
  ru: merge<Strings>(uz as Strings, ru),
}

let current: Locale = DEFAULT_LOCALE

/// Tilni tashqaridan aniqlash — server soʻrov kontekstidan oʻqiydi.
/// `undefined` qaytarsa `setLocale()` bilan qoʻyilgan til ishlaydi
let resolver: () => Locale | undefined = () => undefined

export function getLocale(): Locale {
  return resolver() ?? current
}

export function setLocale(locale: Locale): void {
  current = locale
}

export function setLocaleResolver(resolve: () => Locale | undefined): void {
  resolver = resolve
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/// `Accept-Language` sarlavhasidan qoʻllab-quvvatlanadigan tilni tanlaydi:
/// «ru-RU,ru;q=0.9,en;q=0.8» → ru, «uz-Latn» → uz. Mos til boʻlmasa —
/// sukut boʻyicha oʻzbekcha. Kabinet sarlavhani ilova tilidan qoʻyadi,
/// shuning uchun brauzer tili emas, foydalanuvchi tanlovi ustun
export function parseAcceptLanguage(header: string | undefined | null): Locale {
  if (!header) return DEFAULT_LOCALE
  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';')
      const q = params.map((param) => param.trim()).find((param) => param.startsWith('q='))
      const weight = q ? Number(q.slice(2)) : 1
      return { tag: tag.toLowerCase(), weight: Number.isNaN(weight) ? 0 : weight, index }
    })
    .filter((item) => item.tag && item.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
  for (const { tag } of ranked) {
    const base = tag.split('-')[0]
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}

/// Aniq tildagi matnlar — server soʻrov tiliga qarab ishlatadi
export function strings(locale: Locale = getLocale()): Strings {
  return catalogs[locale]
}

/// Joriy tilga qarab oʻqiladigan toʻplam. Nishon obyekt boʻsh — hamma
/// oʻqish `get` orqali joriy katalogga boradi
function live<K extends keyof Strings>(key: K): Strings[K] {
  const source = () => catalogs[getLocale()][key] as unknown as Record<PropertyKey, unknown>
  // Massiv toʻplamlar (MONTHS) uchun nishon ham massiv: Array.isArray toʻgʻri ishlasin
  const target = (Array.isArray(catalogs.uz[key]) ? [] : {}) as Record<PropertyKey, unknown>
  return new Proxy(target, {
    get: (_t, prop) => Reflect.get(source(), prop),
    has: (_t, prop) => prop in source(),
    ownKeys: () => Reflect.ownKeys(source()),
    getOwnPropertyDescriptor: (_t, prop) => {
      const descriptor = Object.getOwnPropertyDescriptor(source(), prop)
      // Proxy qoidasi: nishon obyektda yoʻq xususiyat «sozlanuvchi» boʻlishi shart
      return descriptor ? { ...descriptor, configurable: true } : undefined
    },
  }) as Strings[K]
}

export const ERROR_TEXT = live('ERROR_TEXT')
export const VALIDATION_TEXT = live('VALIDATION_TEXT')
// Bitta satrdan iborat qiymatlar Proxy boʻla olmaydi — ular oʻzbekchada
// qoladi. Tilga qarab kerak boʻlsa `strings().CURRENCY` orqali oʻqiladi
// (format.ts shunday qiladi)
export const EMPTY_MARK = uz.EMPTY_MARK
export const CURRENCY = uz.CURRENCY
export const ROLE_LABELS = live('ROLE_LABELS')
export const AUTH_TEXT = live('AUTH_TEXT')
export const UI_TEXT = live('UI_TEXT')
export const HOME_UI = live('HOME_UI')
export const SECTION_LABELS = live('SECTION_LABELS')
export const PATIENT_TEXT = live('PATIENT_TEXT')
export const PATIENT_UI = live('PATIENT_UI')
export const TOOTH_STATUS_LABELS = live('TOOTH_STATUS_LABELS')
export const CROWN_MATERIAL_LABELS = live('CROWN_MATERIAL_LABELS')
export const CHART_UI = live('CHART_UI')
export const VISIT_TEXT = live('VISIT_TEXT')
export const BRIDGE_UI = live('BRIDGE_UI')
export const CARD_UI = live('CARD_UI')
export const IMAGE_TEXT = live('IMAGE_TEXT')
export const IMAGE_UI = live('IMAGE_UI')
export const PAYMENT_TEXT = live('PAYMENT_TEXT')
export const PAYMENT_UI = live('PAYMENT_UI')
export const DEBTORS_UI = live('DEBTORS_UI')
export const SERVICE_TEXT = live('SERVICE_TEXT')
export const SERVICE_UI = live('SERVICE_UI')
export const SERVICE_AREA_LABELS = live('SERVICE_AREA_LABELS')
export const SERVICE_AREA_HINTS = live('SERVICE_AREA_HINTS')
export const EXPENSE_TEXT = live('EXPENSE_TEXT')
export const EXPENSE_CATEGORY_LABELS = live('EXPENSE_CATEGORY_LABELS')
export const EXPENSE_UI = live('EXPENSE_UI')
export const REPORT_UI = live('REPORT_UI')
export const TOAST_TEXT = live('TOAST_TEXT')
export const PAYROLL_TEXT = live('PAYROLL_TEXT')
export const PAYROLL_UI = live('PAYROLL_UI')
export const STAFF_TEXT = live('STAFF_TEXT')
export const STAFF_UI = live('STAFF_UI')
export const PERMISSION_LABELS = live('PERMISSION_LABELS')
export const LAB_TEXT = live('LAB_TEXT')
export const LAB_WORK_TYPE_LABELS = live('LAB_WORK_TYPE_LABELS')
export const LAB_MATERIAL_LABELS = live('LAB_MATERIAL_LABELS')
export const LAB_STATUS_LABELS = live('LAB_STATUS_LABELS')
export const LAB_RETURN_REASON_LABELS = live('LAB_RETURN_REASON_LABELS')
export const VITA_SHADES = live('VITA_SHADES')
export const LAB_UI = live('LAB_UI')
export const PLAN_TEXT = live('PLAN_TEXT')
export const PLAN_STATUS_LABELS = live('PLAN_STATUS_LABELS')
export const PLAN_ITEM_STATUS_LABELS = live('PLAN_ITEM_STATUS_LABELS')
export const PLAN_UI = live('PLAN_UI')
export const PLAN_PUBLIC_UI = live('PLAN_PUBLIC_UI')
export const PLAN_PRINT_UI = live('PLAN_PRINT_UI')
export const EXPORT_FILES = live('EXPORT_FILES')
export const EXPORT_COLUMNS = live('EXPORT_COLUMNS')
export const EXPORT_UI = live('EXPORT_UI')
export const QUEUE_TEXT = live('QUEUE_TEXT')
export const QUEUE_UI = live('QUEUE_UI')
export const QUEUE_CABINET_UI = live('QUEUE_CABINET_UI')
export const QUEUE_STATUS_LABELS = live('QUEUE_STATUS_LABELS')
export const FEEDBACK_UI = live('FEEDBACK_UI')
export const FEEDBACK_TAG_LABELS = live('FEEDBACK_TAG_LABELS')
export const FEEDBACK_STATUS_LABELS = live('FEEDBACK_STATUS_LABELS')
export const FEEDBACK_SOURCE_LABELS = live('FEEDBACK_SOURCE_LABELS')
export const FEEDBACK_TEXT = live('FEEDBACK_TEXT')
export const FEEDBACK_CABINET_UI = live('FEEDBACK_CABINET_UI')
export const BILLING_TEXT = live('BILLING_TEXT')
export const ADMIN_UI = live('ADMIN_UI')
export const AUDIT_LABELS = live('AUDIT_LABELS')
export const PATIENT_EXCEL_COLUMNS = live('PATIENT_EXCEL_COLUMNS')
export const EXCEL_UI = live('EXCEL_UI')
export const EXCEL_TEXT = live('EXCEL_TEXT')
export const TABLE_UI = live('TABLE_UI')
export const SETTINGS_UI = live('SETTINGS_UI')
export const LOGO_UI = live('LOGO_UI')
export const PERIOD_UI = live('PERIOD_UI')
export const DOCK_UI = live('DOCK_UI')
export const INVITE_TEXT = live('INVITE_TEXT')
export const INVITE_UI = live('INVITE_UI')
export const IMPORT_TEXT = live('IMPORT_TEXT')
export const IMPORT_UI = live('IMPORT_UI')
export const APPOINTMENT_TEXT = live('APPOINTMENT_TEXT')
export const APPOINTMENT_STATUS_LABELS = live('APPOINTMENT_STATUS_LABELS')
export const SCHEDULE_UI = live('SCHEDULE_UI')
export const MONTHS = live('MONTHS')
export const MONTHS_SHORT = live('MONTHS_SHORT')
export const WEEKDAYS = live('WEEKDAYS')
