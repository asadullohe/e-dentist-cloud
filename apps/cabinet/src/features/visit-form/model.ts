import { APPOINTMENT_TEXT, parseDisplayDate, VALIDATION_TEXT, VISIT_TEXT } from '@e-dentist/shared'
import { isToothNo } from '@e-dentist/teeth'
import { z } from 'zod'

export const visitSchema = z.object({
  // Ekranda KK/OO/YYYY, serverga YYYY-MM-DD
  date: z
    .string()
    .trim()
    .min(1, { error: () => VISIT_TEXT.date_required })
    .refine((value) => parseDisplayDate(value) !== null, {
      error: () => VALIDATION_TEXT.date_invalid,
    })
    .refine(
      (value) => {
        const iso = parseDisplayDate(value)
        return iso === null || new Date(`${iso}T00:00:00Z`) <= new Date()
      },
      { error: () => VALIDATION_TEXT.date_in_future },
    ),
  /// «HH:MM» — brauzerning vaqt maydoni shu shaklda beradi
  time: z
    .string()
    .trim()
    .min(1, { error: () => APPOINTMENT_TEXT.time_required })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: () => APPOINTMENT_TEXT.time_invalid }),
  treatment: z
    .string()
    .trim()
    .min(2, { error: () => VISIT_TEXT.treatment_required })
    .max(300),
  tooth: z
    .string()
    .trim()
    .refine((value) => !value || isToothNo(value), { error: () => VISIT_TEXT.tooth_invalid }),
  /// Maskalangan matn: «250 000»
  price: z.string().trim(),
  /// Texnik narxi — xizmatdan koʻchadi, boʻsh — yoʻq
  labCost: z.string().trim(),
  note: z.string().trim().max(2000),
})

export type VisitValues = z.infer<typeof visitSchema>

export const EMPTY_VISIT: VisitValues = {
  date: '',
  time: '',
  treatment: '',
  tooth: '',
  price: '',
  labCost: '',
  note: '',
}
