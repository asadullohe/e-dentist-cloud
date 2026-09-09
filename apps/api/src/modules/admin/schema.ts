import { z } from 'zod'

export const clinicListSchema = z.object({
  search: z.string().trim().max(120).default(''),
})

export const extendSchema = z.object({
  /// Bir kundan bir yilgacha. Qoʻlda kiritiladigan qiymat, xato tipish
  /// bilan klinikaga oʻn yil berib qoʻymaslik uchun chegara bor
  days: z.coerce.number().int().min(1).max(366),
})

export const statusSchema = z.object({
  status: z.enum(['active', 'blocked']),
})

export type ClinicListInput = z.infer<typeof clinicListSchema>
export type ExtendInput = z.infer<typeof extendSchema>
export type StatusInput = z.infer<typeof statusSchema>

export const eventsSchema = z.object({
  /// Faqat platforma hodisalari: roʻyxatdan oʻtish, kirish urinishlari,
  /// bloklash, muddat. Aks holda klinika ichidagi barcha amallar
  all: z
    .enum(['0', '1'])
    .default('0')
    .transform((value) => value === '1'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export type EventsInput = z.infer<typeof eventsSchema>
