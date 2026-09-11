// Klinika, rollar va ruxsatlar. Boshqa modullar clinics ga faqat shu fayl
// orqali murojaat qiladi (tz.md 2-boʻlim: modul chegarasi).

import {
  IMAGE_TEXT,
  OWNER_REQUIRED_PERMISSIONS,
  PERMISSIONS,
  type Permission,
  STAFF_TEXT,
} from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import type { Storage } from '../../platform/storage.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
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
  /// Logotip fayli shu yerda saqlanadi
  storage: Storage
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

// ─────────────────────────  Logotip  ─────────────────────────
//
// Fayl MinIO da, bazada faqat kalit. Rasm imzolangan havola bilan emas,
// API orqali beriladi: serverda MinIO Docker tarmogʻi ichida turibdi va
// brauzer uning manzilini topa olmaydi.

/// Logotip kichkina boʻlishi kerak — u yon menyuda 32 pikselda koʻrsatiladi
const MAX_LOGO_BYTES = 2 * 1024 * 1024

const LOGO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export interface UploadedLogo {
  buffer: Buffer
  mimetype: string
}

function logoKey(clinicId: string, ext: string): string {
  return `clinics/${clinicId}/logo/${uuidV7()}.${ext}`
}

export async function uploadLogo(
  deps: ClinicDeps,
  clinicId: string,
  userId: string,
  file: UploadedLogo,
): Promise<{ hasLogo: true }> {
  const ext = LOGO_TYPES[file.mimetype]
  if (!ext) throw errors.badRequest(IMAGE_TEXT.wrong_type)
  if (file.buffer.length === 0) throw errors.badRequest(IMAGE_TEXT.no_file)
  if (file.buffer.length > MAX_LOGO_BYTES) throw errors.badRequest(IMAGE_TEXT.too_large)

  const key = logoKey(clinicId, ext)
  // Avval fayl, keyin yozuv: aks holda bazadagi kalit yoʻq faylga
  // koʻrsatib turishi mumkin edi
  await deps.storage.put(key, file.buffer, file.mimetype)

  const previous = await withClinic(deps.db, clinicId, async (tx) => {
    const clinic = await repo.findClinic(tx, clinicId)
    await repo.setLogoKey(tx, clinicId, key)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.clinic_logo_changed,
      entity: 'clinic',
      entityId: clinicId,
    })
    return clinic?.logoKey ?? null
  })

  // Eski fayl endi kerak emas. Oʻchmasa ham xato emas: yozuv yangisiga
  // koʻrsatadi, eskisi shunchaki joy egallaydi
  if (previous && previous !== key) await deps.storage.remove(previous)

  return { hasLogo: true }
}

export async function removeLogo(
  deps: ClinicDeps,
  clinicId: string,
  userId: string,
): Promise<{ hasLogo: false }> {
  const previous = await withClinic(deps.db, clinicId, async (tx) => {
    const clinic = await repo.findClinic(tx, clinicId)
    if (!clinic?.logoKey) return null
    await repo.setLogoKey(tx, clinicId, null)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.clinic_logo_changed,
      entity: 'clinic',
      entityId: clinicId,
    })
    return clinic.logoKey
  })

  if (previous) await deps.storage.remove(previous)
  return { hasLogo: false }
}

/// Navbat kodi boʻyicha: sahifa loginsiz ochiladi va klinika raqami
/// URL da koʻrinmasligi kerak (tz.md 14-boʻlim)
export async function logoByQueueCode(
  deps: ClinicDeps,
  code: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  const clinic = await repo.findByQueueCode(deps.db, code)
  if (!clinic?.logo_key) return null
  return deps.storage.get(clinic.logo_key)
}
