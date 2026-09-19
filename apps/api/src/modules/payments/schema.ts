import { PAYMENT_TEXT, VALIDATION_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/// Toʻlov kelajakda boʻla olmaydi
const paymentDate = z
  .string()
  .trim()
  .min(1, { error: () => PAYMENT_TEXT.date_required })
  .refine((value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)), {
    error: () => VALIDATION_TEXT.date_invalid,
  })
  .refine((value) => new Date(`${value}T00:00:00Z`) <= new Date(), {
    error: () => VALIDATION_TEXT.date_in_future,
  })

export const paymentCreateSchema = z.object({
  patientId: z.string().uuid(),
  date: paymentDate,
  /// Soʻm, butun son
  amount: z.coerce
    .number()
    .int()
    .positive({ error: () => PAYMENT_TEXT.amount_positive }),
  note: z.string().trim().max(500).nullish(),
})

/// Toʻlov oʻzgarmas: summa va sana tahrirlanmaydi — xato boʻlsa bekor qilib
/// yangisi kiritiladi. Faqat izoh tuzatiladi (qaror 19/09/2026)
export const paymentUpdateSchema = z.object({
  note: z.string().trim().max(500).nullish(),
})

/// Bekor qilish — sabab majburiy, u toʻlov yonida koʻrinib turadi
export const paymentCancelSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, { error: () => PAYMENT_TEXT.reason_required })
    .max(500),
})

/// Saralash faqat summalar boʻyicha: ism sahifalashdan keyin olinadi
export const DEBTOR_SORT = ['debt', 'charges', 'paid'] as const

export const debtorsSchema = z.object({
  /// Ism yoki telefon boʻyicha — sahifalashdan oldin
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.enum(DEBTOR_SORT).default('debt'),
  dir: z.enum(['asc', 'desc']).default('desc'),
})

export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>
export type PaymentCancelInput = z.infer<typeof paymentCancelSchema>
export type DebtorsInput = z.infer<typeof debtorsSchema>
