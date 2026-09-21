import { SERVICE_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

const name = (required: () => string) => z.string().trim().min(2, { error: required }).max(200)

export const serviceTypeSchema = z.object({
  name: name(() => SERVICE_TEXT.type_name_required),
})

export const serviceCreateSchema = z.object({
  typeId: z
    .string({ error: () => SERVICE_TEXT.type_required })
    .uuid({ error: () => SERVICE_TEXT.type_required }),
  name: name(() => SERVICE_TEXT.name_required),
  /// Soʻm, butun son
  price: z.coerce
    .number()
    .int()
    .min(0, { error: () => SERVICE_TEXT.price_negative })
    .default(0),
  /// Texnik narxi; null — texnik ishi yoʻq
  techPrice: z.coerce
    .number()
    .int()
    .min(0, { error: () => SERVICE_TEXT.price_negative })
    .nullable()
    .optional(),
})

export const serviceUpdateSchema = serviceCreateSchema.partial()

/// Tartib: idlar yangi ketma-ketlikda — hammasi, toʻliq roʻyxat
export const orderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
})

export type ServiceTypeInput = z.infer<typeof serviceTypeSchema>
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>
export type OrderInput = z.infer<typeof orderSchema>
