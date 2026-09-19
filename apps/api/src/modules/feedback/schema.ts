import { FEEDBACK_STATUSES, FEEDBACK_TAGS, FEEDBACK_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

/// Ochiq sahifadan keladigan fikr. Hammasi ixtiyoriy, faqat baho majburiy —
/// bemor bir bosishda ketishi mumkin
export const feedbackSubmitSchema = z.object({
  rating: z.coerce
    .number()
    .int({ error: () => FEEDBACK_TEXT.rating_required })
    .min(1, { error: () => FEEDBACK_TEXT.rating_required })
    .max(5, { error: () => FEEDBACK_TEXT.rating_required }),
  tags: z.array(z.enum(FEEDBACK_TAGS)).max(FEEDBACK_TAGS.length).default([]),
  comment: z
    .string()
    .trim()
    .max(1000)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .default(null),
  phone: z
    .string()
    .trim()
    .max(30)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .default(null),
  /// Fikr QR varagʻi yoki sahifadagi tugma — shifokorni bemor tanlaydi
  doctorId: z.string().uuid().nullable().default(null),
  /// Navbat raqamidan kelgan fikr — shifokor va bemor raqamdan olinadi
  ticketId: z.string().uuid().nullable().default(null),
  source: z.enum(['qr', 'page']).default('page'),
})

export const feedbackListSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  /// Faqat past baho (1–2)
  low: z.coerce.boolean().optional(),
  doctorId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const feedbackStatusSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES),
})

/// YYYY-MM — bosh sahifa kartasi va shifokorlar jamlanmasi uchun
export const feedbackSummarySchema = z.object({
  month: z
    .string()
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
})

export type FeedbackSubmitInput = z.infer<typeof feedbackSubmitSchema>
export type FeedbackListInput = z.infer<typeof feedbackListSchema>
export type FeedbackStatusInput = z.infer<typeof feedbackStatusSchema>
export type FeedbackSummaryInput = z.infer<typeof feedbackSummarySchema>
