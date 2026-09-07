// Klinika, rollar va ruxsatlar. Boshqa modullar clinics ga faqat shu fayl
// orqali murojaat qiladi (tz.md 2-boʻlim: modul chegarasi).

import { EGASI_MAJBURIY_RUXSATLAR, RUXSATLAR, type Ruxsat } from '@e-dentist/shared'
import { xato } from '../../platform/errors.js'
import type { KlinikaTx } from '../../platform/tenant.js'
import * as repo from './repo.js'

export type { RolMaʼlumoti, YangiKlinika } from './repo.js'

/// Roʻyxatdan oʻtishda chaqiriladi: klinika va beshta rol bitta tranzaksiyada.
/// Egasi rolining id si qaytadi
export async function yaratKlinikaVaRollar(
  tx: KlinikaTx,
  m: repo.YangiKlinika,
): Promise<{ egasiRoliId: string }> {
  await repo.yarat(tx, m)
  return { egasiRoliId: await repo.yaratRolShablonlari(tx) }
}

/// Ochiq tranzaksiya ichida — chaqiruvchi allaqachon sessiya ochgan boʻlsa
export function oqiKlinika(tx: KlinikaTx, clinicId: string) {
  return repo.oqiKlinika(tx, clinicId)
}

export function oqiRol(tx: KlinikaTx, roleId: string) {
  return repo.oqiRol(tx, roleId)
}

/// Rol topilmasa boʻsh roʻyxat: «rol yoʻq» degani «hamma narsaga ruxsat» emas
export async function ruxsatlarniOl(tx: KlinikaTx, roleId: string): Promise<readonly Ruxsat[]> {
  const rol = await repo.oqiRol(tx, roleId)
  if (!rol) return []
  return rol.permissions.filter((p): p is Ruxsat => (RUXSATLAR as readonly string[]).includes(p))
}

/// Rol ruxsatlarini oʻzgartirishdan oldin tekshiriladi (bosqich 3.3 da
/// HTTP orqali ochiladi). Egasi bu ikkitasini yoʻqotsa klinika oʻz
/// kabinetidan qulflanib qoladi — na xodim qoʻsha oladi, na obunani uzaytira
export function tekshirRolRuxsatlari(isOwner: boolean, ruxsatlar: readonly string[]): void {
  const nomaʼlum = ruxsatlar.filter((p) => !(RUXSATLAR as readonly string[]).includes(p))
  if (nomaʼlum.length > 0) {
    throw xato.badRequest(`Notoʻgʻri ruxsat: ${nomaʼlum.join(', ')}`)
  }
  if (!isOwner) return

  const yoqolgan = EGASI_MAJBURIY_RUXSATLAR.filter((p) => !ruxsatlar.includes(p))
  if (yoqolgan.length > 0) {
    throw xato.badRequest(
      'Egasi roli xodimlar va obunani boshqarish huquqini yoʻqota olmaydi — ' +
        'aks holda klinika oʻz kabinetiga kira olmay qoladi',
    )
  }
}
