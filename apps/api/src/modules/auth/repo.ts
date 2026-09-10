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

/// invite_find qaytaradigan qator. SECURITY DEFINER kerak: havolani
/// bosgan odam hali kirmagan, sessiyada klinika yoʻq va RLS jadvalni
/// yopib turadi. Funksiya faqat shu maydonlarni beradi
export interface InviteRow {
  id: string
  clinic_id: string
  role_id: string
  email: string
  expires_at: Date
  accepted_at: Date | null
  clinic_name: string
  role_name: string
}

export async function findInvite(db: Db, tokenHash: string): Promise<InviteRow | null> {
  const rows = await db.$queryRaw<InviteRow[]>`SELECT * FROM invite_find(${tokenHash})`
  return rows[0] ?? null
}

export interface NewInvite {
  inviteId: string
  roleId: string
  email: string
  tokenHash: string
  expiresAt: Date
}

export async function createInvite(tx: ClinicTx, m: NewInvite): Promise<void> {
  await tx.invite.create({
    data: tenantScoped({
      id: m.inviteId,
      roleId: m.roleId,
      email: m.email,
      tokenHash: m.tokenHash,
      expiresAt: m.expiresAt,
    }),
  })
}

/// Qayta yuborishda eski havola ishlamay qolishi kerak: aks holda pochtada
/// bir necha amal qiluvchi havola yotib qoladi
export async function deletePendingInvites(tx: ClinicTx, email: string): Promise<void> {
  await tx.invite.deleteMany({ where: { email, acceptedAt: null } })
}

export async function markInviteAccepted(tx: ClinicTx, inviteId: string): Promise<void> {
  await tx.invite.update({ where: { id: inviteId }, data: { acceptedAt: new Date() } })
}

/// Panelda «Taklif yuborilgan» holati uchun: qabul qilinmagan oxirgisi
export function pendingInvite(tx: ClinicTx) {
  return tx.invite.findFirst({
    where: { acceptedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { email: true, roleId: true, createdAt: true, expiresAt: true },
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

export interface NewStaff {
  userId: string
  roleId: string
  email: string
  passwordHash: string
  fullName: string
}

/// Egasi ochgan hisob darhol faol: pochta tasdigʻi klinikaning oʻzi
/// roʻyxatdan oʻtishida kerak, xodimni esa klinika oʻzi qoʻshadi
export function createStaff(tx: ClinicTx, m: NewStaff) {
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

/// Parolni almashtirish uchun: joriy xeshni oʻqish va yangisini yozish
export async function passwordOf(tx: ClinicTx, userId: string): Promise<string | null> {
  const row = await tx.user.findUnique({ where: { id: userId }, select: { passwordHash: true } })
  return row?.passwordHash ?? null
}

export async function setPassword(tx: ClinicTx, userId: string, passwordHash: string) {
  await tx.user.update({ where: { id: userId }, data: { passwordHash } })
}
