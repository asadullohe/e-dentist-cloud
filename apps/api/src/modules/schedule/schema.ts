import { APPOINTMENT_TEXT, VALIDATION_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const isoDate = z
  .string()
  .trim()
  .refine((value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)), {
    message: VALIDATION_TEXT.date_invalid,
  })

export const appointmentCreateSchema = z.object({
  patientId: z.string().uuid(APPOINTMENT_TEXT.patient_required),
  date: isoDate,
  /// Soat:daqiqa, mahalliy vaqt
  time: z.string().trim().min(1, APPOINTMENT_TEXT.time_required).regex(TIME, {
    message: APPOINTMENT_TEXT.time_invalid,
  }),
  note: z.string().trim().max(500).nullish(),
})

export const appointmentUpdateSchema = z.object({
  date: isoDate.optional(),
  time: z.string().trim().regex(TIME, { message: APPOINTMENT_TEXT.time_invalid }).optional(),
  status: z.enum(['scheduled', 'arrived', 'no_show', 'done', 'cancelled']).optional(),
  note: z.string().trim().max(500).nullish(),
})

export const appointmentListSchema = z.object({
  from: isoDate,
  to: isoDate,
})

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>
export type AppointmentListInput = z.infer<typeof appointmentListSchema>
