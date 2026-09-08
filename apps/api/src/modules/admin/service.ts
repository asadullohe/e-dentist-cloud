// Boshqaruv paneli. Faqat platforma admini uchun.
//
// Admin hech qaysi klinikaga tegishli emas, shuning uchun bu modul
// `withClinic` ishlatmaydi — u ijarachi chegarasidan tashqarida turadi.
// Aynan shu sababli har bir marshrut `requirePlatformAdmin` bilan
// yopiladi va bu yerga faqat klinikalar roʻyxati kabi umumiy maʼlumot
// chiqadi (bemor maʼlumoti hech qachon).

import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'

export interface AdminDeps {
  db: Db
}

export interface AdminUser {
  id: string
  email: string
  fullName: string | null
}

interface AdminRow {
  id: string
  email: string
  full_name: string | null
}

export async function currentAdmin(deps: AdminDeps, userId: string): Promise<AdminUser> {
  // RLS `users` ni yopib turadi va admin qatorida `clinic_id` boʻsh —
  // u hech qanday klinika siyosatiga tushmaydi, yaʼni ilova ulanishiga
  // umuman koʻrinmaydi. Shuning uchun tor SECURITY DEFINER funksiya
  const rows = await deps.db.$queryRaw<AdminRow[]>`SELECT * FROM admin_find(${userId}::uuid)`

  const admin = rows[0]
  if (!admin) throw errors.unauthorized()
  return { id: admin.id, email: admin.email, fullName: admin.full_name }
}
