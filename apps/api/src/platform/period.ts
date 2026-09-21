// Davr soʻrovi: `month=YYYY-MM` (eski shakl) yoki `from`+`to` (YYYY-MM-DD).
// Xarajatlar va hisobotlar bitta sxemani ishlatadi; javob har doim
// `from`/`to` — kun chegaralari YYYY-MM-DD matnida, moduli oʻzi Date ga
// aylantiradi (DATE ustuni UTC, `created_at` mahalliy)

import { EXPENSE_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

/// Yildan uzun davr soʻralmaydi — hisob xotirada yigʻiladi
const MAX_DAYS = 366

export interface DateRange {
  from: string
  to: string
}

const isoDate = z
  .string()
  .trim()
  .refine((value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)), {
    error: () => EXPENSE_TEXT.range_invalid,
  })

function monthRange(month: string): DateRange {
  const [year, index] = month.split('-').map(Number) as [number, number]
  const last = new Date(Date.UTC(year, index, 0)).getUTCDate()
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` }
}

function days(range: DateRange): number {
  return (Date.parse(range.to) - Date.parse(range.from)) / 86_400_000
}

export const periodSchema = z
  .object({
    month: z
      .string()
      .trim()
      .regex(ISO_MONTH, { error: () => EXPENSE_TEXT.month_invalid })
      .optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .transform((value, ctx): DateRange => {
    if (value.from && value.to) {
      const range = { from: value.from, to: value.to }
      const span = days(range)
      if (span < 0 || span > MAX_DAYS) {
        ctx.addIssue({ code: 'custom', path: ['from'], message: EXPENSE_TEXT.range_invalid })
        return z.NEVER
      }
      return range
    }
    if (value.month) return monthRange(value.month)
    ctx.addIssue({ code: 'custom', path: ['from'], message: EXPENSE_TEXT.range_invalid })
    return z.NEVER
  })

export type PeriodInput = z.infer<typeof periodSchema>

/// `YYYY-MM-DD` → DATE ustuni uchun UTC yarim tuni
export function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

/// `YYYY-MM-DD` → mahalliy yarim tun (`created_at` kabi aniq vaqt ustunlari
/// uchun; jarayon TZ si Asia/Tashkent — platform/timezone.ts)
export function localDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

/// Davrning ertasi (mahalliy) — `< to` chegarasi uchun
export function localDateAfter(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d + 1)
}
