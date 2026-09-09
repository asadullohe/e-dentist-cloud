// clinics moduli `clinics` va `roles` jadvallariga egalik qiladi.
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
