import { APPOINTMENT_TEXT, VALIDATION_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const isoDate = z
  .string()
  .trim()
  .refine((value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)), {
    error: () => VALIDATION_TEXT.date_invalid,
  })
const time = z
  .string()
  .trim()
  .regex(TIME, { error: () => APPOINTMENT_TEXT.time_invalid })

/// Shifokorning band vaqti: uzluksiz oraliq — bir kun ichida (tushlik) yoki
/// bir necha kun (taʼtil). Boshi va oxiri sana + vaqt bilan
export const blockCreateSchema = z
  .object({
    /// Berilmasa — yozayotgan odamning oʻzi (schedule.all boʻlmasa doim oʻzi)
    doctorId: z.string().uuid().optional(),
    fromDate: isoDate,
    fromTime: time,
    toDate: isoDate,
    toTime: time,
    reason: z.string().trim().max(200).nullish(),
  })
  .refine((value) => `${value.fromDate}T${value.fromTime}` < `${value.toDate}T${value.toTime}`, {
    error: () => APPOINTMENT_TEXT.block_range,
    path: ['toTime'],
  })

export const blockUpdateSchema = blockCreateSchema

export const blockListSchema = z.object({
  from: isoDate,
  to: isoDate,
  doctorId: z.string().uuid().optional(),
})

export type BlockCreateInput = z.infer<typeof blockCreateSchema>
export type BlockListInput = z.infer<typeof blockListSchema>
