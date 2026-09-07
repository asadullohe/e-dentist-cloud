// clinics moduli `clinics` va `roles` jadvallariga egalik qiladi.
// Boshqa modullar bu yerga emas, service.ts ga murojaat qiladi.

import { ROLE_TEMPLATE_SPECS, ROLE_TEMPLATES } from '@e-dentist/shared'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

export interface NewClinic {
  clinicId: string
  name: string
  phone: string | null
  expiresAt: Date
}

export async function create(tx: ClinicTx, m: NewClinic): Promise<void> {
  await tx.clinic.create({
    data: {
      id: m.clinicId,
      name: m.name,
      phone: m.phone,
      isTrial: true,
      expiresAt: m.expiresAt,
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
    select: { id: true, name: true, isTrial: true, expiresAt: true, status: true },
  })
}
