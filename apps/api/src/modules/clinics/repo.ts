// clinics moduli `clinics`, `roles` va `invites` jadvallariga egalik qiladi.
// Boshqa modullar bu yerga emas, service.ts ga murojaat qiladi.

import { ROLE_TEMPLATE_SPECS, ROLE_TEMPLATES } from '@e-dentist/shared'
import type { Db } from '../../platform/db.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

export interface NewClinic {
  clinicId: string
  name: string
  phone: string | null
  expiresAt: Date
  queueCode: string
}

export async function create(tx: ClinicTx, m: NewClinic): Promise<void> {
  await tx.clinic.create({
    data: {
      id: m.clinicId,
      name: m.name,
      phone: m.phone,
      isTrial: true,
      expiresAt: m.expiresAt,
      queueCode: m.queueCode,
    },
  })
}

/// Beshta rol shablonini nusxalaydi va egasi rolining id sini qaytaradi
export async function createRoleTemplates(tx: ClinicTx): Promise<string> {
  let ownerRoleId = ''
  for (const template of ROLE_TEMPLATES) {
    const spec = ROLE_TEMPLATE_SPECS[template]
    const role = await tx.role.create({
      data: tenantScoped({
        template: template,
        name: spec.label,
        permissions: [...spec.permissions],
        isOwner: spec.isOwner,
      }),
    })
    if (spec.isOwner) ownerRoleId = role.id
  }
  return ownerRoleId
}

export interface RoleInfo {
  name: string
  template: string
  permissions: string[]
  isOwner: boolean
}

export async function findRole(tx: ClinicTx, roleId: string): Promise<RoleInfo | null> {
  return tx.role.findUnique({
    where: { id: roleId },
    select: { name: true, template: true, permissions: true, isOwner: true },
  })
}

export async function findClinic(tx: ClinicTx, clinicId: string) {
  return tx.clinic.findUnique({
    where: { id: clinicId },
    select: {
      id: true,
      name: true,
      isTrial: true,
      expiresAt: true,
      status: true,
      queueCode: true,
      queueEnabled: true,
    },
  })
}

// ─────────────────────────────  Rollar  ─────────────────────────────

const ROLE_SELECT = {
  id: true,
  name: true,
  template: true,
  permissions: true,
  isOwner: true,
}

export function listRoles(tx: ClinicTx) {
  return tx.role.findMany({ select: ROLE_SELECT, orderBy: { name: 'asc' } })
}

export function findRoleById(tx: ClinicTx, roleId: string) {
  return tx.role.findUnique({ where: { id: roleId }, select: ROLE_SELECT })
}

export function setRolePermissions(tx: ClinicTx, roleId: string, permissions: string[]) {
  return tx.role.update({ where: { id: roleId }, data: { permissions }, select: ROLE_SELECT })
}

// ──────────────────────────  Taklifnomalar  ──────────────────────────

const INVITE_SELECT = {
  id: true,
  email: true,
  roleId: true,
  expiresAt: true,
  createdAt: true,
}

export interface NewInvite {
  id: string
  roleId: string
  email: string
  tokenHash: string
  expiresAt: Date
}

export function createInvite(tx: ClinicTx, m: NewInvite) {
  return tx.invite.create({ data: tenantScoped(m), select: INVITE_SELECT })
}

/// Faqat kutayotganlari: qabul qilingani xodimlar roʻyxatida koʻrinadi,
/// muddati oʻtgani esa foydasiz
export function listPendingInvites(tx: ClinicTx) {
  return tx.invite.findMany({
    where: { acceptedAt: null, expiresAt: { gt: new Date() } },
    select: INVITE_SELECT,
    orderBy: { createdAt: 'desc' },
  })
}

export function findPendingInviteByEmail(tx: ClinicTx, email: string) {
  return tx.invite.findFirst({
    where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: INVITE_SELECT,
  })
}

export function deleteInvite(tx: ClinicTx, id: string) {
  return tx.invite.delete({ where: { id } })
}

export function markInviteAccepted(tx: ClinicTx, id: string) {
  return tx.invite.update({ where: { id }, data: { acceptedAt: new Date() } })
}

/// invite_find funksiyasi qaytaradigan qator (SECURITY DEFINER):
/// havolani ochgan odam hali klinikaga tegishli emas, RLS `invites` ni
/// yopib turadi
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

export async function findInviteByTokenHash(db: Db, tokenHash: string): Promise<InviteRow | null> {
  const rows = await db.$queryRaw<InviteRow[]>`SELECT * FROM invite_find(${tokenHash})`
  return rows[0] ?? null
}

/// clinic_by_queue_code funksiyasi qaytaradigan qator (SECURITY DEFINER):
/// navbat sahifasi loginsiz ochiladi, RLS esa `clinics` ni yopib turadi
export interface QueueClinicRow {
  id: string
  name: string
  queue_enabled: boolean
}

export async function findByQueueCode(db: Db, code: string): Promise<QueueClinicRow | null> {
  const rows = await db.$queryRaw<QueueClinicRow[]>`SELECT * FROM clinic_by_queue_code(${code})`
  return rows[0] ?? null
}
