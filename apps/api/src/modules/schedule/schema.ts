import { APPOINTMENT_TEXT, VALIDATION_TEXT } from '@e-dentist/shared'
import { z } from 'zod'
import { visitCreateSchema } from '../visits/service.js'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/// Daqiqa: 5 dan 8 soatgacha, 5 qadam. Jadvalda blok uzunligi shunga qaraydi
const duration = z.coerce
  .number()
  .int({ error: () => APPOINTMENT_TEXT.duration_invalid })
  .min(5, { error: () => APPOINTMENT_TEXT.duration_invalid })
  .max(480, { error: () => APPOINTMENT_TEXT.duration_invalid })
  .multipleOf(5, { error: () => APPOINTMENT_TEXT.duration_invalid })

const isoDate = z
  .string()
  .trim()
  .refine((value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)), {
    error: () => VALIDATION_TEXT.date_invalid,
  })

export const appointmentCreateSchema = z.object({
  patientId: z.string().uuid({ error: () => APPOINTMENT_TEXT.patient_required }),
  /// Berilmasa — bemorning biriktirilgan shifokori; `null` — shifokorsiz
  doctorId: z
    .string()
    .uuid({ error: () => VALIDATION_TEXT.doctor_invalid })
    .nullable()
    .optional(),
  date: isoDate,
  /// Soat:daqiqa, mahalliy vaqt
  time: z
    .string()
    .trim()
    .min(1, { error: () => APPOINTMENT_TEXT.time_required })
    .regex(TIME, {
      error: () => APPOINTMENT_TEXT.time_invalid,
    }),
  duration: duration.default(30),
  note: z.string().trim().max(500).nullish(),
})

export const appointmentUpdateSchema = z.object({
  doctorId: z
    .string()
    .uuid({ error: () => VALIDATION_TEXT.doctor_invalid })
    .nullable()
    .optional(),
  date: isoDate.optional(),
  time: z
    .string()
    .trim()
    .regex(TIME, { error: () => APPOINTMENT_TEXT.time_invalid })
    .optional(),
  duration: duration.optional(),
  status: z.enum(['scheduled', 'arrived', 'no_show', 'done', 'cancelled']).optional(),
  note: z.string().trim().max(500).nullish(),
})

/// Qabulni yakunlash = tashrif yozish (visits sxemasi) + holat «done».
/// Bemor va sana qabuldan olinadi, shifokor — berilmasa qabulniki
export const appointmentCompleteSchema = visitCreateSchema.omit({ patientId: true, date: true })

export const appointmentListSchema = z.object({
  from: isoDate,
  to: isoDate,
  doctorId: z.string().uuid().optional(),
})

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>
export type AppointmentListInput = z.infer<typeof appointmentListSchema>
export type AppointmentCompleteInput = z.infer<typeof appointmentCompleteSchema>
