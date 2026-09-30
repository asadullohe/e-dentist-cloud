// Mijoz tomonidagi tekshiruv — tez javob berish uchun. Yakuniy tekshiruv
// baribir serverda: bu yerdagisi faqat foydalanuvchiga qulaylik.

import { AUTH_TEXT, CLINIC_KINDS, clinicNameError, INVITE_UI, phoneDigits } from '@e-dentist/shared'
import { z } from 'zod'

const email = z
  .string()
  .trim()
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value), {
    error: () => AUTH_TEXT.email_invalid,
  })

export const loginSchema = z.object({
  email,
  // Kirishda uzunlik tekshirilmaydi: eski parol qoidalari boshqacha
  // boʻlishi mumkin, «parol qisqa» degan xabar esa bu yerda maʼnosiz
  password: z.string().min(1, { error: () => AUTH_TEXT.password_too_short }),
})

// Nom qoidasi turga bogʻliq (tz.md 20-boʻlim) — server bilan bitta funksiya
export const registerSchema = z
  .object({
    kind: z.enum(CLINIC_KINDS),
    clinicName: z.string().trim(),
    phone: z
      .string()
      .trim()
      .refine((value) => !value || phoneDigits(value).length === 9, {
        error: () => AUTH_TEXT.phone_invalid,
      }),
    fullName: z
      .string()
      .trim()
      .min(3, { error: () => AUTH_TEXT.full_name_too_short }),
    email,
    password: z
      .string()
      .min(8, { error: () => AUTH_TEXT.password_too_short })
      .max(200, { error: () => AUTH_TEXT.password_too_long }),
  })
  .superRefine((value, ctx) => {
    const error = clinicNameError(value.kind, value.clinicName)
    if (error) ctx.addIssue({ code: 'custom', path: ['clinicName'], message: error })
  })

/// Taklifnoma: pochta havoladan keladi, shuning uchun bu yerda yoʻq.
/// Parol ikki marta soʻraladi — bir marta yozilib xato qolsa, odam
/// kabinetiga kira olmay qoladi va yangi havola soʻrashga toʻgʻri keladi
export const inviteSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, { error: () => AUTH_TEXT.full_name_too_short }),
    password: z
      .string()
      .min(8, { error: () => AUTH_TEXT.password_too_short })
      .max(200, { error: () => AUTH_TEXT.password_too_long }),
    passwordAgain: z.string(),
  })
  .refine((values) => values.password === values.passwordAgain, {
    error: () => INVITE_UI.password_mismatch,
    path: ['passwordAgain'],
  })

export type InviteValues = z.infer<typeof inviteSchema>
export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
