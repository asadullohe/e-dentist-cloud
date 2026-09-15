import { VALIDATION_TEXT, VISIT_TEXT } from '@e-dentist/shared'
import { CROWN_MATERIALS, isToothNo, TOOTH_STATUSES } from '@e-dentist/teeth'
import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/// Tashrif kelajakda boʻla olmaydi — kelajakdagi uchrashuv «qabul»,
/// u appointments jadvalida (bosqich 2.16)
const visitDate = z
  .string()
  .trim()
  .min(1, { error: () => VISIT_TEXT.date_required })
  .refine((value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)), {
    error: () => VALIDATION_TEXT.date_invalid,
  })
  .refine((value) => new Date(`${value}T00:00:00Z`) <= new Date(), {
    error: () => VALIDATION_TEXT.date_in_future,
  })

const toothNumber = z.coerce
  .number()
  .int()
  .refine((value) => isToothNo(value), { error: () => VISIT_TEXT.tooth_invalid })

export const visitCreateSchema = z.object({
  patientId: z.string().uuid(),
  /// Berilmasa — yozayotgan odamning oʻzi (u `visits.write` bilan kirgan)
  doctorId: z
    .string()
    .uuid({ error: () => VISIT_TEXT.doctor_invalid })
    .optional(),
  date: visitDate,
  treatment: z
    .string()
    .trim()
    .min(2, { error: () => VISIT_TEXT.treatment_required })
    .max(300),
  tooth: toothNumber.nullish(),
  serviceId: z.string().uuid().nullish(),
  price: z.coerce
    .number()
    .int()
    .min(0, { error: () => VISIT_TEXT.price_negative })
    .default(0),
  note: z.string().trim().max(2000).nullish(),
})

export const visitUpdateSchema = visitCreateSchema.omit({ patientId: true }).partial()

export const toothUpdateSchema = z.object({
  status: z.string().refine((value) => TOOTH_STATUSES.includes(value as never), {
    error: () => VISIT_TEXT.status_invalid,
  }),
  material: z
    .string()
    .refine((value) => CROWN_MATERIALS.includes(value as never), {
      error: () => VISIT_TEXT.material_invalid,
    })
    .nullish(),
  note: z.string().trim().max(500).nullish(),
})

export type VisitCreateInput = z.infer<typeof visitCreateSchema>
export type VisitUpdateInput = z.infer<typeof visitUpdateSchema>
export type ToothUpdateInput = z.infer<typeof toothUpdateSchema>

/// Koʻprikdagi tishning roli tishning holatiga aylanadi: tayanch tish
/// «koronka», tishi yoʻq joy «koprik» (quyma tish) boʻladi
export const BRIDGE_ROLES = ['koronka', 'koprik'] as const

export const bridgeCreateSchema = z.object({
  from: toothNumber,
  to: toothNumber,
  material: z
    .string()
    .refine((value) => CROWN_MATERIALS.includes(value as never), {
      error: () => VISIT_TEXT.material_invalid,
    })
    .default(''),
  /// Tish raqami → rol. Berilmagan tishga sukut rol qoʻyiladi
  roles: z.record(z.string(), z.enum(BRIDGE_ROLES)).default({}),
})

export type BridgeCreateInput = z.infer<typeof bridgeCreateSchema>
