// Kirish maʼlumotlarini tekshirish. Xato matnlari oʻzbekcha va
// packages/shared/strings.ts dan keladi.

import { AUTH, phoneDigits } from '@e-dentist/shared'
import { z } from 'zod'

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, AUTH.email_notogri)
  .max(200, AUTH.email_notogri)
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), AUTH.email_notogri)

const parol = z.string().min(8, AUTH.parol_qisqa).max(200, AUTH.parol_uzun)

export const RoyxatSxemasi = z.object({
  clinicName: z.string().trim().min(2, AUTH.klinika_nomi_qisqa).max(120),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || phoneDigits(v).length === 9, AUTH.telefon_notogri),
  fullName: z.string().trim().min(3, AUTH.fio_qisqa).max(120),
  email,
  password: parol,
})

export const TasdiqlashSxemasi = z.object({
  token: z.string().min(10),
})

export const KirishSxemasi = z.object({
  email,
  // Kirishda uzunlik tekshirilmaydi: eski parol qoidalari boshqacha boʻlishi
  // mumkin, va «parol qisqa» degan xabar kirish oynasida maʼnosiz
  password: z.string().min(1),
})

export type RoyxatKirishi = z.infer<typeof RoyxatSxemasi>
export type KirishKirishi = z.infer<typeof KirishSxemasi>
