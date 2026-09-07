// auth moduli `users` jadvaliga egalik qiladi: hisob, parol, pochta tasdigʻi.
// Klinika va rollar — clinics modulida.

import type { Db } from '../../platform/db.js'
import { ijarachisiz, type KlinikaTx } from '../../platform/tenant.js'

/// auth_find_user funksiyasi qaytaradigan qator.
/// SECURITY DEFINER: kirish paytida klinika hali nomaʼlum va RLS users
/// jadvalini yopib turadi. Funksiya faqat shu maydonlarni beradi
export interface AuthQator {
  id: string
  clinic_id: string | null
  role_id: string | null
  password_hash: string
  status: 'active' | 'disabled'
  email_verified_at: Date | null
}

export async function topPochtaBoyicha(db: Db, email: string): Promise<AuthQator | null> {
  const qatorlar = await db.$queryRaw<AuthQator[]>`SELECT * FROM auth_find_user(${email})`
  return qatorlar[0] ?? null
}

export async function tasdiqlaKalit(
  db: Db,
  kalitXeshi: string,
): Promise<{ user_id: string; clinic_id: string } | null> {
  const qatorlar = await db.$queryRaw<{ user_id: string; clinic_id: string }[]>`
    SELECT * FROM auth_verify_email(${kalitXeshi})`
  return qatorlar[0] ?? null
}

export interface YangiEgasi {
  userId: string
  roleId: string
  email: string
  passwordHash: string
  fullName: string
  emailVerifyTokenHash: string
  emailVerifyExpiresAt: Date
}

export async function yaratEgasi(tx: KlinikaTx, m: YangiEgasi): Promise<void> {
  await tx.user.create({
    data: ijarachisiz({
      id: m.userId,
      roleId: m.roleId,
      email: m.email,
      passwordHash: m.passwordHash,
      fullName: m.fullName,
      emailVerifyTokenHash: m.emailVerifyTokenHash,
      emailVerifyExpiresAt: m.emailVerifyExpiresAt,
    }),
  })
}

export async function belgilaKirish(tx: KlinikaTx, userId: string): Promise<void> {
  await tx.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } })
}

export async function oqiFoydalanuvchi(tx: KlinikaTx, userId: string) {
  return tx.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, roleId: true, status: true },
  })
}
