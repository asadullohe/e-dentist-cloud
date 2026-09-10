import { AUTH_TEXT, phoneDigits } from '@e-dentist/shared'
import { z } from 'zod'

export const clinicListSchema = z.object({
  search: z.string().trim().max(120).default(''),
})

/// Panelidan klinika ochish. Parol soʻralmaydi — egasi uni taklifnoma
/// havolasi orqali oʻzi qoʻyadi
export const clinicCreateSchema = z.object({
  name: z.string().trim().min(2, AUTH_TEXT.clinic_name_too_short).max(120),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || phoneDigits(v).length === 9, AUTH_TEXT.phone_invalid),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, AUTH_TEXT.email_invalid)
    .max(200, AUTH_TEXT.email_invalid)
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), AUTH_TEXT.email_invalid),
  trialDays: z.coerce.number().int().min(1).max(366).default(14),
})

export const extendSchema = z.object({
  /// Bir kundan bir yilgacha. Qoʻlda kiritiladigan qiymat, xato tipish
  /// bilan klinikaga oʻn yil berib qoʻymaslik uchun chegara bor
  days: z.coerce.number().int().min(1).max(366),
})

export const statusSchema = z.object({
  status: z.enum(['active', 'blocked']),
})

export type ClinicCreateInput = z.infer<typeof clinicCreateSchema>
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
