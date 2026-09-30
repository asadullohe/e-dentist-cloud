import { AUTH_TEXT, STAFF_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

// Yangi xodim formasi
export const staffSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ error: () => AUTH_TEXT.email_invalid }),
  fullName: z
    .string()
    .trim()
    .min(3, { error: () => AUTH_TEXT.full_name_too_short })
    .max(120),
  roleId: z.string().uuid({ error: () => STAFF_TEXT.role_required }),
  // Faqat assistentda (tz.md 20-boʻlim); majburiyligi rolga bogʻliq — submit da
  doctorIds: z.array(z.string()),
  password: z
    .string()
    .min(8, { error: () => AUTH_TEXT.password_too_short })
    .max(200),
  // Ish haqi sharti — ixtiyoriy, maskalangan matn (tz.md 15-boʻlim)
  salaryAmount: z.string().trim(),
  payPercent: z
    .string()
    .trim()
    .refine((value) => value === '' || (Number(value) >= 0 && Number(value) <= 100), {
      error: () => STAFF_TEXT.percent_range,
    }),
})

export type StaffValues = z.infer<typeof staffSchema>

export const EMPTY_STAFF: StaffValues = {
  email: '',
  fullName: '',
  roleId: '',
  doctorIds: [],
  password: '',
  salaryAmount: '',
  payPercent: '',
}
