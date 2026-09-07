// Klinika, rollar va ruxsatlar. Boshqa modullar clinics ga faqat shu fayl
// orqali murojaat qiladi (tz.md 2-boʻlim: modul chegarasi).

import { OWNER_REQUIRED_PERMISSIONS, PERMISSIONS, type Permission } from '@e-dentist/shared'
import { errors } from '../../platform/errors.js'
import type { ClinicTx } from '../../platform/tenant.js'
import * as repo from './repo.js'

export type { NewClinic, RoleInfo } from './repo.js'

/// Roʻyxatdan oʻtishda chaqiriladi: klinika va beshta rol bitta tranzaksiyada.
/// Egasi rolining id si qaytadi
export async function createClinicWithRoles(
  tx: ClinicTx,
  m: repo.NewClinic,
): Promise<{ ownerRoleId: string }> {
  await repo.create(tx, m)
  return { ownerRoleId: await repo.createRoleTemplates(tx) }
}

/// Ochiq tranzaksiya ichida — chaqiruvchi allaqachon sessiya ochgan boʻlsa
export function findClinic(tx: ClinicTx, clinicId: string) {
  return repo.findClinic(tx, clinicId)
}

export function findRole(tx: ClinicTx, roleId: string) {
  return repo.findRole(tx, roleId)
}

/// Rol topilmasa boʻsh roʻyxat: «rol yoʻq» degani «hamma narsaga ruxsat» emas
export async function getPermissions(tx: ClinicTx, roleId: string): Promise<readonly Permission[]> {
  const role = await repo.findRole(tx, roleId)
  if (!role) return []
  return role.permissions.filter((p): p is Permission =>
    (PERMISSIONS as readonly string[]).includes(p),
  )
}

/// Rol ruxsatlarini oʻzgartirishdan oldin tekshiriladi (bosqich 3.3 da
/// HTTP orqali ochiladi). Egasi bu ikkitasini yoʻqotsa klinika oʻz
/// kabinetidan qulflanib qoladi — na xodim qoʻsha oladi, na obunani uzaytira
export function assertRolePermissions(isOwner: boolean, permissions: readonly string[]): void {
  const unknown = permissions.filter((p) => !(PERMISSIONS as readonly string[]).includes(p))
  if (unknown.length > 0) {
    throw errors.badRequest(`Notoʻgʻri ruxsat: ${unknown.join(', ')}`)
  }
  if (!isOwner) return

  const missing = OWNER_REQUIRED_PERMISSIONS.filter((p) => !permissions.includes(p))
  if (missing.length > 0) {
    throw errors.badRequest(
      'Egasi roli xodimlar va obunani boshqarish huquqini yoʻqota olmaydi — ' +
        'aks holda klinika oʻz kabinetiga kira olmay qoladi',
    )
  }
}
