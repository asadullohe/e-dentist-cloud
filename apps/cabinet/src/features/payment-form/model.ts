import { PAYMENT_TEXT, parseDisplayDate, VALIDATION_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

export const paymentSchema = z.object({
  date: z
    .string()
    .trim()
    .min(1, PAYMENT_TEXT.date_required)
    .refine((value) => parseDisplayDate(value) !== null, VALIDATION_TEXT.date_invalid)
    .refine((value) => {
      const iso = parseDisplayDate(value)
      return iso === null || new Date(`${iso}T00:00:00Z`) <= new Date()
    }, VALIDATION_TEXT.date_in_future),
  /// Maskalangan matn: «200 000»
  amount: z
    .string()
    .trim()
    .refine((value) => Number(value.replace(/\D/g, '')) > 0, PAYMENT_TEXT.amount_positive),
  note: z.string().trim().max(500),
})

export type PaymentValues = z.infer<typeof paymentSchema>

export const EMPTY_PAYMENT: PaymentValues = { date: '', amount: '', note: '' }
