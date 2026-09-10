// Kirish maʼlumotlarini tekshirish. Xato matnlari oʻzbekcha va
// packages/shared/strings.ts dan keladi.

import { AUTH_TEXT, phoneDigits, STAFF_TEXT } from '@e-dentist/shared'
import { z } from 'zod'

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, AUTH_TEXT.email_invalid)
  .max(200, AUTH_TEXT.email_invalid)
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), AUTH_TEXT.email_invalid)

const password = z
  .string()
  .min(8, AUTH_TEXT.password_too_short)
  .max(200, AUTH_TEXT.password_too_long)

export const registerSchema = z.object({
  clinicName: z.string().trim().min(2, AUTH_TEXT.clinic_name_too_short).max(120),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || phoneDigits(v).length === 9, AUTH_TEXT.phone_invalid),
  fullName: z.string().trim().min(3, AUTH_TEXT.full_name_too_short).max(120),
  email,
  password: password,
})

export const verifySchema = z.object({
  token: z.string().min(10),
})

export const loginSchema = z.object({
  email,
  // Kirishda uzunlik tekshirilmaydi: eski parol qoidalari boshqacha boʻlishi
  // mumkin, va «parol qisqa» degan xabar kirish oynasida maʼnosiz
  password: z.string().min(1),
})

export const staffCreateSchema = z.object({
  email,
  fullName: z.string().trim().min(3, STAFF_TEXT.name_required).max(120),
  roleId: z.string().uuid(STAFF_TEXT.role_required),
  // Parolni egasi belgilaydi va xodimga aytadi; xodim keyin oʻzgartiradi
  password,
})

export const staffUpdateSchema = z.object({
  roleId: z.string().uuid(STAFF_TEXT.role_not_found).optional(),
  status: z.enum(['active', 'disabled']).optional(),
})

/// Taklifnomani qabul qilish: kalit havoladan, ism va parol odamdan
export const inviteAcceptSchema = z.object({
  token: z.string().min(10),
  fullName: z.string().trim().min(3, AUTH_TEXT.full_name_too_short).max(120),
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
