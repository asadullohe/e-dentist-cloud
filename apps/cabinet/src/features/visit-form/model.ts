import { parseDisplayDate, VALIDATION_TEXT, VISIT_TEXT } from '@e-dentist/shared'
import { isToothNo } from '@e-dentist/teeth'
import { z } from 'zod'

export const visitSchema = z.object({
  // Ekranda KK/OO/YYYY, serverga YYYY-MM-DD
  date: z
    .string()
    .trim()
    .min(1, VISIT_TEXT.date_required)
    .refine((value) => parseDisplayDate(value) !== null, VALIDATION_TEXT.date_invalid)
    .refine((value) => {
      const iso = parseDisplayDate(value)
      return iso === null || new Date(`${iso}T00:00:00Z`) <= new Date()
    }, VALIDATION_TEXT.date_in_future),
  treatment: z.string().trim().min(2, VISIT_TEXT.treatment_required).max(300),
  tooth: z
    .string()
    .trim()
    .refine((value) => !value || isToothNo(value), VISIT_TEXT.tooth_invalid),
  /// Maskalangan matn: «250 000»
  price: z.string().trim(),
  note: z.string().trim().max(2000),
})

export type VisitValues = z.infer<typeof visitSchema>

export const EMPTY_VISIT: VisitValues = {
  date: '',
  treatment: '',
  tooth: '',
  price: '',
  note: '',
}
