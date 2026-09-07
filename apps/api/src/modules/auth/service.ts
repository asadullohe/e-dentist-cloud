// Kirish, roʻyxatdan oʻtish va pochtani tasdiqlash mantigʻi.
// Boshqa modullar auth ga faqat shu fayl orqali murojaat qiladi.

import { createHash, randomBytes } from 'node:crypto'
import { AUTH, fmtDate, kunQoshib } from '@e-dentist/shared'
import type { Db } from '../../platform/db.js'
import { xato } from '../../platform/errors.js'
import { tekshirParol, xeshlaParol } from '../../platform/parol.js'
import type { PochtaYuboruvchi } from '../../platform/pochta.js'
import type { SessiyaMazmuni, SessiyaSaqlagich } from '../../platform/sessiya.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as repo from './repo.js'
import type { KirishKirishi, RoyxatKirishi } from './schema.js'

const SINOV_KUNI = 14
const TASDIQLASH_SOATI = 24

export interface AuthDeps {
  db: Db
  sessiyalar: SessiyaSaqlagich
  pochta: PochtaYuboruvchi
  cabinetUrl: string
}

// Pochta topilmaganda ham parol tekshiruvi bajarilishi kerak: aks holda javob
// vaqti «bunday pochta bormi» degan savolga javob berib qoʻyadi
let soxtaXesh: string | null = null
async function soxtaXeshOl(): Promise<string> {
  soxtaXesh ??= await xeshlaParol(randomBytes(32).toString('hex'))
  return soxtaXesh
}

function kalitYarat(): { kalit: string; xesh: string } {
  const kalit = randomBytes(32).toString('base64url')
  return { kalit, xesh: createHash('sha256').update(kalit).digest('hex') }
}

function soatQoshib(soat: number): Date {
  return new Date(Date.now() + soat * 60 * 60 * 1000)
}

function pochtaBandmi(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002'
}

export async function royxatdanOt(
  deps: AuthDeps,
  kirish: RoyxatKirishi,
): Promise<{ clinicId: string }> {
  // Klinikaning id si bazadan emas, shu yerdan: RLS siyosati yozuvni
  // kiritishdan oldin sessiyada oʻsha id turishini talab qiladi
  const clinicId = uuidV7()
  const userId = uuidV7()
  const { kalit, xesh } = kalitYarat()
  const expiresAt = kunQoshib(SINOV_KUNI)

  try {
    await repo.yaratKlinikaVaEgasi(deps.db, {
      clinicId,
      clinicName: kirish.clinicName,
      phone: kirish.phone ?? null,
      expiresAt,
      userId,
      email: kirish.email,
      passwordHash: await xeshlaParol(kirish.password),
      fullName: kirish.fullName,
      emailVerifyTokenHash: xesh,
      emailVerifyExpiresAt: soatQoshib(TASDIQLASH_SOATI),
    })
  } catch (e) {
    if (pochtaBandmi(e)) throw xato.conflict(AUTH.email_band)
    throw e
  }

  await deps.pochta.yubor({
    kimga: kirish.email,
    mavzu: AUTH.xat_mavzusi,
    matn: [
      'Assalomu alaykum!',
      '',
      `«${kirish.clinicName}» uchun E-Dentist hisobi yaratildi.`,
      `Sinov muddati ${fmtDate(expiresAt.toISOString().slice(0, 10))} gacha.`,
      '',
      'Pochtangizni tasdiqlash uchun quyidagi havolani oching:',
      `${deps.cabinetUrl}/tasdiqlash?kalit=${kalit}`,
      '',
      `Havola ${TASDIQLASH_SOATI} soat amal qiladi.`,
      'Agar bu siz boʻlmasangiz, xatni eʼtiborsiz qoldiring.',
    ].join('\n'),
  })

  return { clinicId }
}

export async function tasdiqla(deps: AuthDeps, kalit: string): Promise<void> {
  const xesh = createHash('sha256').update(kalit).digest('hex')
  const natija = await repo.tasdiqlaKalit(deps.db, xesh)
  if (!natija) throw xato.badRequest(AUTH.havola_yaroqsiz)
}

export async function kir(deps: AuthDeps, kirish: KirishKirishi): Promise<string> {
  const u = await repo.topPochtaBoyicha(deps.db, kirish.email)

  if (!u) {
    // Vaqtni tenglashtirish uchun — natija baribir rad etish
    await tekshirParol(await soxtaXeshOl(), kirish.password)
    throw xato.unauthorized(AUTH.kirish_xato)
  }

  if (!(await tekshirParol(u.password_hash, kirish.password))) {
    throw xato.unauthorized(AUTH.kirish_xato)
  }

  if (u.status !== 'active') throw xato.forbidden(AUTH.hisob_faolsiz)
  if (!u.email_verified_at) throw xato.forbidden(AUTH.pochta_tasdiqlanmagan)

  if (u.clinic_id) await repo.belgilaKirish(deps.db, u.clinic_id, u.id)

  return deps.sessiyalar.yarat({
    userId: u.id,
    clinicId: u.clinic_id,
    roleId: u.role_id,
  })
}

export async function chiq(deps: AuthDeps, sessiyaId: string): Promise<void> {
  await deps.sessiyalar.ochir(sessiyaId)
}

export async function men(deps: AuthDeps, sessiya: SessiyaMazmuni) {
  if (!sessiya.clinicId) {
    // Platforma admini — bosqich 5.2 da
    throw xato.forbidden()
  }

  const u = await repo.oqiKabinet(deps.db, sessiya.clinicId, sessiya.userId)
  if (!u) throw xato.unauthorized()

  return {
    user: { id: u.id, email: u.email, fullName: u.fullName },
    clinic: u.clinic,
    role: u.role ? { name: u.role.name, template: u.role.template, isOwner: u.role.isOwner } : null,
    permissions: u.role?.permissions ?? [],
  }
}
