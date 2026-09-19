import { FEEDBACK_TEXT, PERMISSIONS } from '@e-dentist/shared'
import { z } from 'zod'

export const rolePermissionsSchema = z.object({
  permissions: z.array(z.enum(PERMISSIONS)),
})

export type RolePermissionsInput = z.infer<typeof rolePermissionsSchema>

export const queueSettingsSchema = z.object({
  enabled: z.boolean(),
})

export type QueueSettingsInput = z.infer<typeof queueSettingsSchema>

/// Boʻsh satr — «oʻchirildi»: bazada null
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === '' ? null : value))

/// Bemor sahifasi kontaktlari (12-bosqich). Havola faqat http(s): boshqa
/// sxema (javascript:) bemor sahifasiga tugma boʻlib tushmasin
export const publicProfileSchema = z.object({
  publicPhone: optionalText(30),
  address: optionalText(200),
  reviewUrl: optionalText(500).refine((value) => value === null || /^https?:\/\//i.test(value), {
    error: () => FEEDBACK_TEXT.bad_url,
  }),
})

export type PublicProfileInput = z.infer<typeof publicProfileSchema>
