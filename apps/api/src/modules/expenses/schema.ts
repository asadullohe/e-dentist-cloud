import { EXPENSE_CATEGORY_LABELS, EXPENSE_TEXT, VALIDATION_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as [string, ...string[]]

/// Xarajat kelajakda boʻlmaydi — hali sarflanmagan pul xarajat emas
const expenseDate = z
  .string()
  .trim()
  .min(1, EXPENSE_TEXT.date_required)
  .refine((value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)), {
    message: VALIDATION_TEXT.date_invalid,
  })
  .refine((value) => new Date(`${value}T00:00:00Z`) <= new Date(), {
    message: VALIDATION_TEXT.date_in_future,
  })

export const expenseListSchema = z.object({
  /// YYYY-MM. Sahifa doim bitta oyni koʻrsatadi
  month: z.string().trim().regex(ISO_MONTH, EXPENSE_TEXT.month_invalid),
})

export const expenseCreateSchema = z.object({
  date: expenseDate,
  category: z.enum(CATEGORIES, { message: EXPENSE_TEXT.category_invalid }).default('other'),
  description: z.string().trim().min(2, EXPENSE_TEXT.description_required).max(300),
  /// Soʻm, butun son
  amount: z.coerce.number().int().positive(EXPENSE_TEXT.amount_required),
})

export const expenseUpdateSchema = expenseCreateSchema.partial()

export type ExpenseListInput = z.infer<typeof expenseListSchema>
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>
