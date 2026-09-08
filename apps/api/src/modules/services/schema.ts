import { SERVICE_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

export const serviceCreateSchema = z.object({
  name: z.string().trim().min(2, SERVICE_TEXT.name_required).max(200),
  /// Soʻm, butun son
  price: z.coerce.number().int().min(0, SERVICE_TEXT.price_negative).default(0),
})

export const serviceUpdateSchema = serviceCreateSchema.partial()

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>
