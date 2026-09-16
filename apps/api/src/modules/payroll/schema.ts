import { EXPENSE_TEXT, PAYROLL_TEXT, VALIDATION_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

const month = z
  .string()
  .trim()
  .regex(ISO_MONTH, { error: () => EXPENSE_TEXT.month_invalid })

export const payrollSchema = z.object({
  /// YYYY-MM
  month,
})

/// Ishlar roʻyxati. `userId` berilmasa — soʻrovchining oʻzi
export const payrollVisitsSchema = z.object({
  month,
  userId: z.string().uuid().optional(),
})

export const recalculateSchema = z.object({
  month,
  userId: z.string().uuid(),
})

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/// Toʻlab berish: summa va sana xarajatga yoziladi (tz.md 15-boʻlim)
export const payoutCreateSchema = z.object({
  month,
  userId: z.string().uuid(),
  amount: z.coerce
    .number()
    .int()
    .positive({ error: () => PAYROLL_TEXT.amount_required }),
  date: z
    .string()
    .trim()
    .refine((value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)), {
      error: () => VALIDATION_TEXT.date_invalid,
    }),
  note: z.string().trim().max(300).nullish(),
})

export type PayoutCreateInput = z.infer<typeof payoutCreateSchema>
export type PayrollInput = z.infer<typeof payrollSchema>
export type PayrollVisitsInput = z.infer<typeof payrollVisitsSchema>
export type RecalculateInput = z.infer<typeof recalculateSchema>
