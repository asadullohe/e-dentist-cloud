import { phoneDigits, VALIDATION_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const OLDEST_YEAR = 1900

const birthDate = z
  .string()
  .trim()
  .refine((value) => ISO_DATE.test(value), VALIDATION_TEXT.date_invalid)
  .refine((value) => !Number.isNaN(Date.parse(value)), VALIDATION_TEXT.date_invalid)
  .refine((value) => new Date(value) <= new Date(), VALIDATION_TEXT.date_in_future)
  .refine((value) => new Date(value).getUTCFullYear() >= OLDEST_YEAR, VALIDATION_TEXT.date_too_old)

export const patientCreateSchema = z.object({
  fio: z.string().trim().min(3, VALIDATION_TEXT.fio_too_short).max(200),
  // Telefon majburiy emas, lekin kiritilgan boʻlsa toʻliq boʻlishi kerak
  phone: z
    .string()
    .trim()
    .refine((value) => !value || phoneDigits(value).length === 9, VALIDATION_TEXT.phone_incomplete)
    .optional(),
  birthDate: birthDate.optional(),
  address: z.string().trim().max(300).optional(),
  note: z.string().trim().max(2000).optional(),
})

export const patientUpdateSchema = patientCreateSchema.partial()

export const patientListSchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type PatientCreateInput = z.infer<typeof patientCreateSchema>
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>
export type PatientListInput = z.infer<typeof patientListSchema>

export const importCommitSchema = z.object({
  token: z.string().min(1),
  /// Takrorlangan bemor bilan nima qilinsin
  mode: z.enum(['skip', 'update', 'add']).default('skip'),
})

export type ImportCommitInput = z.infer<typeof importCommitSchema>
