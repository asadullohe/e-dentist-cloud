import { parseDisplayDate, phoneDigits, VALIDATION_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

export const patientSchema = z.object({
  fio: z.string().trim().min(3, VALIDATION_TEXT.fio_too_short).max(200),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || phoneDigits(value).length === 9, VALIDATION_TEXT.phone_incomplete),
  // Ekranda KK/OO/YYYY, serverga YYYY-MM-DD ketadi
  birthDate: z
    .string()
    .trim()
    .refine((value) => !value || parseDisplayDate(value) !== null, VALIDATION_TEXT.date_invalid),
  address: z.string().trim().max(300),
  note: z.string().trim().max(2000),
})

export type PatientValues = z.infer<typeof patientSchema>

export const EMPTY_PATIENT: PatientValues = {
  fio: '',
  phone: '',
  birthDate: '',
  address: '',
  note: '',
}
