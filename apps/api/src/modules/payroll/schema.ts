import { EXPENSE_TEXT } from '@e-dentist/shared'
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

export type PayrollInput = z.infer<typeof payrollSchema>
export type PayrollVisitsInput = z.infer<typeof payrollVisitsSchema>
export type RecalculateInput = z.infer<typeof recalculateSchema>
