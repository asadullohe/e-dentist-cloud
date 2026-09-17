import { phoneDigits, QUEUE_TEXT, VALIDATION_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

export const queueJoinSchema = z.object({
  doctorId: z.string().uuid({ error: () => QUEUE_TEXT.doctor_required }),
  fullName: z
    .string()
    .trim()
    .min(3, { error: () => QUEUE_TEXT.name_required })
    .max(120),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || phoneDigits(value).length === 9, {
      error: () => VALIDATION_TEXT.phone_incomplete,
    }),
})

/// «Yakunlandi» bu yerda yoʻq: u qilingan ish bilan birga
/// POST /appointments/:id/complete orqali qoʻyiladi (10.6)
export const queueStatusSchema = z.object({
  action: z.enum(['confirm', 'call', 'arrived', 'no_show']),
})

/// Kabinetdan navbatga qoʻshish: kartotekadagi bemor + shifokor (10.3)
export const queueEnqueueSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid({ error: () => QUEUE_TEXT.doctor_required }),
})

export type QueueJoinInput = z.infer<typeof queueJoinSchema>
export type QueueStatusInput = z.infer<typeof queueStatusSchema>
export type QueueEnqueueInput = z.infer<typeof queueEnqueueSchema>
