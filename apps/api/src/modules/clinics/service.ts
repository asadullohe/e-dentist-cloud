// Klinika, rollar va ruxsatlar. Boshqa modullar clinics ga faqat shu fayl
// orqali murojaat qiladi (tz.md 2-boʻlim: modul chegarasi).

import {
  OWNER_REQUIRED_PERMISSIONS,
  PERMISSIONS,
  type Permission,
  STAFF_TEXT,
} from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { generateQueueCode } from './queueCode.js'
import * as repo from './repo.js'

export type { NewClinic, RoleInfo } from './repo.js'

/// Roʻyxatdan oʻtishda chaqiriladi: klinika va beshta rol bitta tranzaksiyada.
/// Egasi rolining id si qaytadi
export async function createClinicWithRoles(
  tx: ClinicTx,
  m: Omit<repo.NewClinic, 'queueCode'>,
): Promise<{ ownerRoleId: string }> {
  await repo.create(tx, { ...m, queueCode: generateQueueCode() })
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

// ─────────────────────────  Rollar (HTTP orqali)  ─────────────────────────

export interface ClinicDeps {
  db: Db
}

export function listRoles(deps: ClinicDeps, clinicId: string) {
  return withClinic(deps.db, clinicId, (tx) => repo.listRoles(tx))
}

/// Rol ruxsatlarini almashtiradi. Egasi roli majburiy ruxsatlarni yoʻqota
/// olmaydi — assertRolePermissions tekshiradi
export function updateRolePermissions(
  deps: ClinicDeps,
  clinicId: string,
  userId: string,
  roleId: string,
  permissions: string[],
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const role = await repo.findRoleById(tx, roleId)
    if (!role) throw errors.notFound(STAFF_TEXT.role_not_found)

    assertRolePermissions(role.isOwner, permissions)

    const updated = await repo.setRolePermissions(tx, roleId, permissions)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.role_changed,
      entity: 'role',
      entityId: roleId,
      meta: { permissions },
    })
    return updated
  })
}

// ────────────────  Taklifnomalar (auth moduli uchun)  ────────────────
//
// Yozuv shu modulniki, lekin xat yuborish va hisob ochish auth da:
// `users` jadvali oʻshaniki. Shuning uchun bu funksiyalar ochiq
// tranzaksiya ichida ishlaydi — chaqiruvchi sessiyani oʻzi ochadi

export function createInviteTx(tx: ClinicTx, m: repo.NewInvite) {
  return repo.createInvite(tx, m)
}

export function listPendingInvitesTx(tx: ClinicTx) {
  return repo.listPendingInvites(tx)
}

export function findPendingInviteByEmailTx(tx: ClinicTx, email: string) {
  return repo.findPendingInviteByEmail(tx, email)
}

export function deleteInviteTx(tx: ClinicTx, id: string) {
  return repo.deleteInvite(tx, id)
}

export function markInviteAcceptedTx(tx: ClinicTx, id: string) {
  return repo.markInviteAccepted(tx, id)
}

/// Sessiyasiz qidiruv — havolani ochgan odam hali klinikaga tegishli emas
export function findInviteByToken(db: Db, tokenHash: string) {
  return repo.findInviteByTokenHash(db, tokenHash)
}

export function listRolesTx(tx: ClinicTx) {
  return repo.listRoles(tx)
}

export function findRoleByIdTx(tx: ClinicTx, roleId: string) {
  return repo.findRoleById(tx, roleId)
}

/// Navbat kodi boʻyicha klinika. Sessiyasiz — ochiq sahifa uchun
export function findByQueueCode(db: Db, code: string) {
  return repo.findByQueueCode(db, code)
}

/// Navbatni yoqish/oʻchirish (tz.md 14-boʻlim: klinika navbatni butunlay
/// yopa oladi)
export function setQueueEnabled(deps: ClinicDeps, clinicId: string, enabled: boolean) {
  return withClinic(deps.db, clinicId, (tx) =>
    tx.clinic.update({ where: { id: clinicId }, data: { queueEnabled: enabled } }),
  )
}
