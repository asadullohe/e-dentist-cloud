import { EXPENSE_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

export const reportSchema = z.object({
  /// YYYY-MM — hisobot shu oy uchun, grafik shu oy bilan tugaydigan 12 oy
  month: z.string().trim().regex(ISO_MONTH, EXPENSE_TEXT.month_invalid),
})

export type ReportInput = z.infer<typeof reportSchema>
