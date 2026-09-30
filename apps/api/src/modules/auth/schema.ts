// Kirish maʼlumotlarini tekshirish. Xato matnlari oʻzbekcha va
// packages/shared/strings.ts dan keladi.

import {
  AUTH_TEXT,
  CLINIC_KINDS,
  clinicNameError,
  phoneDigits,
  STAFF_TEXT,
} from '@e-dentist/shared'
import { z } from 'zod'

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: () => AUTH_TEXT.email_invalid })
  .max(200, { error: () => AUTH_TEXT.email_invalid })
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), { error: () => AUTH_TEXT.email_invalid })

const password = z
  .string()
  .min(8, { error: () => AUTH_TEXT.password_too_short })
  .max(200, { error: () => AUTH_TEXT.password_too_long })

// Tur roʻyxatning birinchi qadamida tanlanadi (tz.md 20-boʻlim). Sukut —
// klinika: eski mijoz (tursiz soʻrov) oldingidek ishlaydi
export const registerSchema = z
  .object({
    kind: z.enum(CLINIC_KINDS).default('clinic'),
    // Individualda ixtiyoriy — boʻsh boʻlsa shifokorning ismi olinadi
    clinicName: z.string().trim().max(120).default(''),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || phoneDigits(v).length === 9, { error: () => AUTH_TEXT.phone_invalid }),
    fullName: z
      .string()
      .trim()
      .min(3, { error: () => AUTH_TEXT.full_name_too_short })
      .max(120),
    email,
    password: password,
  })
  .superRefine((v, ctx) => {
    const error = clinicNameError(v.kind, v.clinicName)
    if (error) ctx.addIssue({ code: 'custom', path: ['clinicName'], message: error })
  })

export const verifySchema = z.object({
  token: z.string().min(10),
})

export const loginSchema = z.object({
  email,
  // Kirishda uzunlik tekshirilmaydi: eski parol qoidalari boshqacha boʻlishi
  // mumkin, va «parol qisqa» degan xabar kirish oynasida maʼnosiz
  password: z.string().min(1),
  /// Qaysi ilovadan kirilyapti — kabinet va panel bitta kirishni ishlatadi,
  /// hisob boshqa ilovaniki boʻlsa sessiya ochilmaydi. Berilmasa tekshirilmaydi
  app: z.enum(['cabinet', 'admin']).optional(),
})

/// Ish haqi sharti — ikkalasi ixtiyoriy, sukut 0 (tz.md 15-boʻlim)
const salaryAmount = z.coerce
  .number()
  .int()
  .min(0, { error: () => STAFF_TEXT.salary_negative })
const payPercent = z.coerce
  .number()
  .int()
  .min(0, { error: () => STAFF_TEXT.percent_range })
  .max(100, { error: () => STAFF_TEXT.percent_range })

const doctorIds = z.array(z.string().uuid({ error: () => STAFF_TEXT.doctor_not_found })).max(50)

export const staffCreateSchema = z.object({
  email,
  fullName: z
    .string()
    .trim()
    .min(3, { error: () => STAFF_TEXT.name_required })
    .max(120),
  roleId: z.string().uuid({ error: () => STAFF_TEXT.role_required }),
  // Parolni egasi belgilaydi va xodimga aytadi; xodim keyin oʻzgartiradi
  password,
  salaryAmount: salaryAmount.default(0),
  payPercent: payPercent.default(0),
  // Assistent kimga yordam beradi (tz.md 20-boʻlim). Boshqa rollarda eʼtiborsiz
  doctorIds: doctorIds.optional(),
})

export const staffUpdateSchema = z.object({
  roleId: z
    .string()
    .uuid({ error: () => STAFF_TEXT.role_not_found })
    .optional(),
  status: z.enum(['active', 'disabled']).optional(),
  salaryAmount: salaryAmount.optional(),
  payPercent: payPercent.optional(),
  doctorIds: doctorIds.optional(),
})

/// Taklifnomani qabul qilish: kalit havoladan, ism va parol odamdan
export const inviteAcceptSchema = z.object({
  token: z.string().min(10),
  fullName: z
    .string()
    .trim()
    .min(3, { error: () => AUTH_TEXT.full_name_too_short })
    .max(120),
  password,
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
})

export type StaffCreateInput = z.infer<typeof staffCreateSchema>
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>

export type InviteAcceptInput = z.infer<typeof inviteAcceptSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
