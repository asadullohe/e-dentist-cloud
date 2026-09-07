// Baza qatlami. Modulning boshqa qismlari bazaga faqat shu fayl orqali kiradi.

import { ROL_SHABLONI_TAVSIFI, ROL_SHABLONLARI } from '@e-dentist/shared'
import type { Db } from '../../platform/db.js'
import { ijarachisiz, klinikaSessiyasi } from '../../platform/tenant.js'

/// auth_find_user funksiyasi qaytaradigan qator.
/// Bu funksiya SECURITY DEFINER: kirish paytida klinika hali nomaʼlum va RLS
/// users jadvalini yopib turadi. Funksiya faqat shu maydonlarni beradi
export interface AuthQator {
  id: string
  clinic_id: string | null
  role_id: string | null
  password_hash: string
  status: 'active' | 'disabled'
  email_verified_at: Date | null
}

export async function topPochtaBoyicha(db: Db, email: string): Promise<AuthQator | null> {
  const qatorlar = await db.$queryRaw<AuthQator[]>`SELECT * FROM auth_find_user(${email})`
  return qatorlar[0] ?? null
}

export async function tasdiqlaKalit(
  db: Db,
  kalitXeshi: string,
): Promise<{ user_id: string; clinic_id: string } | null> {
  const qatorlar = await db.$queryRaw<{ user_id: string; clinic_id: string }[]>`
    SELECT * FROM auth_verify_email(${kalitXeshi})`
  return qatorlar[0] ?? null
}

export interface YangiKlinika {
  clinicId: string
  clinicName: string
  phone: string | null
  expiresAt: Date
  userId: string
  email: string
  passwordHash: string
  fullName: string
  emailVerifyTokenHash: string
  emailVerifyExpiresAt: Date
}

/// Klinika, beshta rol va egasi — bitta tranzaksiyada.
///
/// Diqqat: clinicId chaqiruvchi tomonidan yaratiladi va sessiya konteksti
/// oʻsha id bilan ochiladi. RLS siyosati `WITH CHECK (id = app_clinic_id())`
/// deb turadi — bazaning oʻzi id yaratguncha kutib boʻlmaydi
export async function yaratKlinikaVaEgasi(db: Db, m: YangiKlinika): Promise<void> {
  await klinikaSessiyasi(db, m.clinicId, async (tx) => {
    await tx.clinic.create({
      data: {
        id: m.clinicId,
        name: m.clinicName,
        phone: m.phone,
        isTrial: true,
        expiresAt: m.expiresAt,
      },
    })

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

    await tx.user.create({
      data: ijarachisiz({
        id: m.userId,
        roleId: egasiRoliId,
        email: m.email,
        passwordHash: m.passwordHash,
        fullName: m.fullName,
        emailVerifyTokenHash: m.emailVerifyTokenHash,
        emailVerifyExpiresAt: m.emailVerifyExpiresAt,
      }),
    })

    await tx.auditLog.create({
      data: ijarachisiz({
        userId: m.userId,
        action: 'royxatdan_otdi',
        entity: 'clinic',
        entityId: m.clinicId,
      }),
    })
  })
}

export async function belgilaKirish(db: Db, clinicId: string, userId: string): Promise<void> {
  await klinikaSessiyasi(db, clinicId, async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } })
    await tx.auditLog.create({
      data: ijarachisiz({ userId, action: 'kirdi', entity: 'user', entityId: userId }),
    })
  })
}

export async function oqiKabinet(db: Db, clinicId: string, userId: string) {
  return klinikaSessiyasi(db, clinicId, (tx) =>
    tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: { select: { name: true, template: true, permissions: true, isOwner: true } },
        clinic: { select: { id: true, name: true, isTrial: true, expiresAt: true, status: true } },
      },
    }),
  )
}
