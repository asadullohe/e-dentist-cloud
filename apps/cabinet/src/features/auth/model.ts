// Mijoz tomonidagi tekshiruv — tez javob berish uchun. Yakuniy tekshiruv
// baribir serverda: bu yerdagisi faqat foydalanuvchiga qulaylik.

import { AUTH_TEXT, phoneDigits } from '@e-dentist/shared'
import { z } from 'zod'

const email = z
  .string()
  .trim()
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value), AUTH_TEXT.email_invalid)

export const loginSchema = z.object({
  email,
  // Kirishda uzunlik tekshirilmaydi: eski parol qoidalari boshqacha
  // boʻlishi mumkin, «parol qisqa» degan xabar esa bu yerda maʼnosiz
  password: z.string().min(1, AUTH_TEXT.password_too_short),
})

export const registerSchema = z.object({
  clinicName: z.string().trim().min(2, AUTH_TEXT.clinic_name_too_short),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || phoneDigits(value).length === 9, AUTH_TEXT.phone_invalid),
  fullName: z.string().trim().min(3, AUTH_TEXT.full_name_too_short),
  email,
  password: z.string().min(8, AUTH_TEXT.password_too_short).max(200, AUTH_TEXT.password_too_long),
})

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
