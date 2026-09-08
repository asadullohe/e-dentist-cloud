// auth moduli `users` jadvaliga egalik qiladi: hisob, parol, pochta tasdigʻi.
// Klinika va rollar — clinics modulida.

import type { Db } from '../../platform/db.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

/// auth_find_user funksiyasi qaytaradigan qator.
/// SECURITY DEFINER: kirish paytida klinika hali nomaʼlum va RLS users
/// jadvalini yopib turadi. Funksiya faqat shu maydonlarni beradi
export interface AuthUserRow {
  id: string
  clinic_id: string | null
  role_id: string | null
  password_hash: string
  status: 'active' | 'disabled'
  email_verified_at: Date | null
}

export async function findByEmail(db: Db, email: string): Promise<AuthUserRow | null> {
  const rows = await db.$queryRaw<AuthUserRow[]>`SELECT * FROM auth_find_user(${email})`
  return rows[0] ?? null
}

export async function consumeVerifyToken(
  db: Db,
  tokenHash: string,
): Promise<{ user_id: string; clinic_id: string } | null> {
  const rows = await db.$queryRaw<{ user_id: string; clinic_id: string }[]>`
    SELECT * FROM auth_verify_email(${tokenHash})`
  return rows[0] ?? null
}

export interface NewOwner {
  userId: string
  roleId: string
  email: string
  passwordHash: string
  fullName: string
  emailVerifyTokenHash: string
  emailVerifyExpiresAt: Date
}

export async function createOwner(tx: ClinicTx, m: NewOwner): Promise<void> {
  await tx.user.create({
    data: tenantScoped({
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

export async function markLogin(tx: ClinicTx, userId: string): Promise<void> {
  await tx.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } })
}

export async function findUser(tx: ClinicTx, userId: string) {
  return tx.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, roleId: true, status: true },
  })
}

// ─────────────────────────────  Xodimlar  ─────────────────────────────

const STAFF_SELECT = {
  id: true,
  email: true,
  fullName: true,
  roleId: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
}

export function listStaff(tx: ClinicTx) {
  return tx.user.findMany({ select: STAFF_SELECT, orderBy: { createdAt: 'asc' } })
}

export function findStaffByIds(tx: ClinicTx, ids: string[]) {
  return tx.user.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true } })
}

export function findStaff(tx: ClinicTx, userId: string) {
  return tx.user.findUnique({ where: { id: userId }, select: STAFF_SELECT })
}

export function updateStaff(
  tx: ClinicTx,
  userId: string,
  data: { roleId?: string; status?: 'active' | 'disabled' },
) {
  return tx.user.update({ where: { id: userId }, data, select: STAFF_SELECT })
}

/// Faol egalar soni. Oxirgisini faolsizlantirib boʻlmaydi — klinika oʻz
/// kabinetidan qulflanib qoladi (tz.md 6-boʻlim)
export function countActiveByRoles(tx: ClinicTx, roleIds: string[]) {
  return tx.user.count({ where: { roleId: { in: roleIds }, status: 'active' } })
}

export interface InvitedUser {
  userId: string
  roleId: string
  email: string
  passwordHash: string
  fullName: string
}

/// Taklifnoma bilan ochilgan hisob darhol faol: havolaning oʻzi pochta
/// egaligini isbotlaydi, shuning uchun qayta tasdiqlash soʻralmaydi
export function createInvited(tx: ClinicTx, m: InvitedUser) {
  return tx.user.create({
    data: tenantScoped({
      id: m.userId,
      roleId: m.roleId,
      email: m.email,
      passwordHash: m.passwordHash,
      fullName: m.fullName,
      emailVerifiedAt: new Date(),
    }),
    select: STAFF_SELECT,
  })
}
