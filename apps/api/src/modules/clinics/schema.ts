import { PERMISSIONS } from '@e-dentist/shared'
import { z } from 'zod'

export const rolePermissionsSchema = z.object({
  permissions: z.array(z.enum(PERMISSIONS)),
})

export type RolePermissionsInput = z.infer<typeof rolePermissionsSchema>

export const queueSettingsSchema = z.object({
  enabled: z.boolean(),
})

export type QueueSettingsInput = z.infer<typeof queueSettingsSchema>
