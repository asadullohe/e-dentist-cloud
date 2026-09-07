// clinics moduli `clinics` va `roles` jadvallariga egalik qiladi.
// Boshqa modullar bu yerga emas, service.ts ga murojaat qiladi.

import { ROL_SHABLONI_TAVSIFI, ROL_SHABLONLARI } from '@e-dentist/shared'
import { ijarachisiz, type KlinikaTx } from '../../platform/tenant.js'

export interface YangiKlinika {
  clinicId: string
  name: string
  phone: string | null
  expiresAt: Date
}

export async function yarat(tx: KlinikaTx, m: YangiKlinika): Promise<void> {
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
export async function yaratRolShablonlari(tx: KlinikaTx): Promise<string> {
  let egasiRoliId = ''
  for (const shablon of ROL_SHABLONLARI) {
    const tavsif = ROL_SHABLONI_TAVSIFI[shablon]
    const rol = await tx.role.create({
      data: ijarachisiz({
        template: shablon,
        name: tavsif.nom,
        permissions: [...tavsif.ruxsatlar],
        isOwner: tavsif.isOwner,
      }),
    })
    if (tavsif.isOwner) egasiRoliId = rol.id
  }
  return egasiRoliId
}

export interface RolMaʼlumoti {
  name: string
  template: string
  permissions: string[]
  isOwner: boolean
}

export async function oqiRol(tx: KlinikaTx, roleId: string): Promise<RolMaʼlumoti | null> {
  return tx.role.findUnique({
    where: { id: roleId },
    select: { name: true, template: true, permissions: true, isOwner: true },
  })
}

export async function oqiKlinika(tx: KlinikaTx, clinicId: string) {
  return tx.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, name: true, isTrial: true, expiresAt: true, status: true },
  })
}
