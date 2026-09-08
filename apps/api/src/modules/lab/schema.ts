import { LAB_TEXT, VALIDATION_TEXT, VITA_SHADES } from '@e-dentist/shared'
import { isToothNo } from '@e-dentist/teeth'
import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const WORK_TYPES = [
  'crown',
  'bridge',
  'denture',
  'clasp_denture',
  'veneer',
  'inlay',
  'mouthguard',
  'ortho_plate',
] as const

const MATERIALS = [
  'metal_ceramic',
  'zirconia',
  'press_ceramic',
  'acrylic',
  'cast_metal',
  'nylon',
] as const

export const LAB_STATUSES = ['issued', 'ready', 'delivered'] as const
export const RETURN_REASONS = ['fit', 'shade', 'broken', 'other'] as const

/// Muddat kelajakda boʻlishi odatiy hol — tashrifdan farqi shu
const dueDate = z
  .string()
  .trim()
  .min(1, LAB_TEXT.due_required)
  .refine((value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)), {
    message: VALIDATION_TEXT.date_invalid,
  })

export const labCreateSchema = z.object({
  patientId: z.string().uuid(),
  techId: z.string().uuid().nullish(),
  teeth: z
    .array(z.coerce.number().int().refine(isToothNo, LAB_TEXT.tooth_invalid))
    .min(1, LAB_TEXT.teeth_required),
  workType: z.enum(WORK_TYPES),
  material: z.enum(MATERIALS),
  shade: z.enum(VITA_SHADES, { message: LAB_TEXT.shade_invalid }).nullish(),
  dueDate,
  /// Soʻm, butun son
  techPrice: z.coerce.number().int().min(0, LAB_TEXT.price_negative).default(0),
  note: z.string().trim().max(2000).nullish(),
})

export const labUpdateSchema = labCreateSchema.omit({ patientId: true }).partial()

export const labStatusSchema = z.object({
  status: z.enum(LAB_STATUSES),
})

export const labReturnSchema = z.object({
  reason: z.enum(RETURN_REASONS, { message: LAB_TEXT.reason_required }),
  note: z.string().trim().max(2000).nullish(),
})

export const labListSchema = z.object({
  status: z.enum(LAB_STATUSES).optional(),
  techId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
})

export type LabCreateInput = z.infer<typeof labCreateSchema>
export type LabUpdateInput = z.infer<typeof labUpdateSchema>
export type LabStatusInput = z.infer<typeof labStatusSchema>
export type LabReturnInput = z.infer<typeof labReturnSchema>
export type LabListInput = z.infer<typeof labListSchema>
