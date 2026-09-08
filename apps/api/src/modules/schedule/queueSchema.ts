import { phoneDigits, QUEUE_TEXT, VALIDATION_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

export const queueJoinSchema = z.object({
  doctorId: z.string().uuid(QUEUE_TEXT.doctor_required),
  fullName: z.string().trim().min(3, QUEUE_TEXT.name_required).max(120),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || phoneDigits(value).length === 9, VALIDATION_TEXT.phone_incomplete),
})

export const queueStatusSchema = z.object({
  action: z.enum(['confirm', 'call', 'arrived', 'no_show', 'done']),
})

export type QueueJoinInput = z.infer<typeof queueJoinSchema>
export type QueueStatusInput = z.infer<typeof queueStatusSchema>
