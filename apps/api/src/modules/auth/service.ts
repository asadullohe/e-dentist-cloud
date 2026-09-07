// Kirish, roʻyxatdan oʻtish va pochtani tasdiqlash mantigʻi.
// Boshqa modullar auth ga faqat shu fayl orqali murojaat qiladi.

import { createHash, randomBytes } from 'node:crypto'
import { AUTH, birMartalikPochtami, fmtDate, kunQoshib, type Ruxsat } from '@e-dentist/shared'
import { AMAL, yozAudit } from '../../platform/audit.js'
import type { Cheklagich } from '../../platform/cheklov.js'
import type { Db } from '../../platform/db.js'
import { xato } from '../../platform/errors.js'
import { tekshirParol, xeshlaParol } from '../../platform/parol.js'
import type { PochtaYuboruvchi } from '../../platform/pochta.js'
import type { SessiyaMazmuni, SessiyaSaqlagich } from '../../platform/sessiya.js'
import { klinikaSessiyasi } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as clinics from '../clinics/service.js'
import * as repo from './repo.js'
import type { KirishKirishi, RoyxatKirishi } from './schema.js'

const SINOV_KUNI = 14
const TASDIQLASH_SOATI = 24

// Cheklovlar. Hisob boʻyicha qattiqroq: bitta hisobga parol tanlashni
// toʻsish kerak. IP boʻyicha yumshoqroq: bitta klinikada bir necha xodim
// bitta tarmoqdan kirishi mumkin
const KIRISH_OYNA = 15 * 60
const KIRISH_HISOB_CHEGARA = 5
const KIRISH_IP_CHEGARA = 20
const ROYXAT_OYNA = 24 * 60 * 60
const ROYXAT_IP_CHEGARA = 3

export interface AuthDeps {
  db: Db
  sessiyalar: SessiyaSaqlagich
  cheklagich: Cheklagich
  pochta: PochtaYuboruvchi
  cabinetUrl: string
  log: (xabar: string, maʼlumot?: Record<string, unknown>) => void
}

// Pochta topilmaganda ham parol tekshiruvi bajarilishi kerak: aks holda
// javob vaqti «bunday pochta bormi» degan savolga javob berib qoʻyadi
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
  ip: string,
): Promise<{ clinicId: string }> {
  if (birMartalikPochtami(kirish.email)) {
    throw xato.validation({ email: AUTH.bir_martalik_pochta })
  }

  const cheklov = await deps.cheklagich.urin(`royxat:ip:${ip}`, ROYXAT_IP_CHEGARA, ROYXAT_OYNA)
  if (!cheklov.ruxsat) throw xato.rateLimited(AUTH.kop_royxat)

  // Klinikaning id si bazadan emas, shu yerdan: RLS siyosati yozuvni
  // kiritishdan oldin sessiyada oʻsha id turishini talab qiladi
  const clinicId = uuidV7()
  const userId = uuidV7()
  const { kalit, xesh } = kalitYarat()
  const expiresAt = kunQoshib(SINOV_KUNI)
  const passwordHash = await xeshlaParol(kirish.password)

  try {
    await klinikaSessiyasi(deps.db, clinicId, async (tx) => {
      const { egasiRoliId } = await clinics.yaratKlinikaVaRollar(tx, {
        clinicId,
        name: kirish.clinicName,
        phone: kirish.phone ?? null,
        expiresAt,
      })
      await repo.yaratEgasi(tx, {
        userId,
        roleId: egasiRoliId,
        email: kirish.email,
        passwordHash,
        fullName: kirish.fullName,
        emailVerifyTokenHash: xesh,
        emailVerifyExpiresAt: soatQoshib(TASDIQLASH_SOATI),
      })
      await yozAudit(tx, {
        userId,
        action: AMAL.royxatdan_otdi,
        entity: 'clinic',
        entityId: clinicId,
        meta: { ip },
      })
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

  await klinikaSessiyasi(deps.db, natija.clinic_id, (tx) =>
    yozAudit(tx, {
      userId: natija.user_id,
      action: AMAL.pochta_tasdiqlandi,
      entity: 'user',
      entityId: natija.user_id,
    }),
  )
}

export async function kir(deps: AuthDeps, kirish: KirishKirishi, ip: string): Promise<string> {
  const ipCheklov = await deps.cheklagich.urin(`kirish:ip:${ip}`, KIRISH_IP_CHEGARA, KIRISH_OYNA)
  if (!ipCheklov.ruxsat) throw xato.rateLimited(AUTH.kop_urinish)

  const hisobKaliti = `kirish:hisob:${kirish.email}`
  const hisobCheklov = await deps.cheklagich.urin(hisobKaliti, KIRISH_HISOB_CHEGARA, KIRISH_OYNA)
  if (!hisobCheklov.ruxsat) throw xato.rateLimited(AUTH.kop_urinish)

  const u = await repo.topPochtaBoyicha(deps.db, kirish.email)

  if (!u) {
    // Vaqtni tenglashtirish uchun — natija baribir rad etish.
    // Klinika nomaʼlum, shuning uchun audit emas, oddiy log
    await tekshirParol(await soxtaXeshOl(), kirish.password)
    deps.log('nomaʼlum pochta bilan kirishga urinish', { ip })
    throw xato.unauthorized(AUTH.kirish_xato)
  }

  if (!(await tekshirParol(u.password_hash, kirish.password))) {
    if (u.clinic_id) {
      await klinikaSessiyasi(deps.db, u.clinic_id, (tx) =>
        yozAudit(tx, {
          userId: u.id,
          action: AMAL.kirish_xatosi,
          entity: 'user',
          entityId: u.id,
          meta: { ip },
        }),
      )
    }
    throw xato.unauthorized(AUTH.kirish_xato)
  }

  if (u.status !== 'active') throw xato.forbidden(AUTH.hisob_faolsiz)
  if (!u.email_verified_at) throw xato.forbidden(AUTH.pochta_tasdiqlanmagan)

  if (u.clinic_id) {
    await klinikaSessiyasi(deps.db, u.clinic_id, async (tx) => {
      await repo.belgilaKirish(tx, u.id)
      await yozAudit(tx, {
        userId: u.id,
        action: AMAL.kirdi,
        entity: 'user',
        entityId: u.id,
        meta: { ip },
      })
    })
  }

  // Muvaffaqiyatli kirishdan keyin hisob hisoblagichi tozalanadi
  await deps.cheklagich.tozala(hisobKaliti)

  return deps.sessiyalar.yarat({ userId: u.id, clinicId: u.clinic_id })
}

export async function chiq(deps: AuthDeps, sessiyaId: string, sessiya: SessiyaMazmuni | null) {
  await deps.sessiyalar.ochir(sessiyaId)
  if (sessiya?.clinicId) {
    await klinikaSessiyasi(deps.db, sessiya.clinicId, (tx) =>
      yozAudit(tx, {
        userId: sessiya.userId,
        action: AMAL.chiqdi,
        entity: 'user',
        entityId: sessiya.userId,
      }),
    )
  }
}

/// Ruxsat tekshiruvi shuni chaqiradi (platform/kirish.ts).
///
/// Rol foydalanuvchidan, ruxsatlar roldan — ikkalasi ham har soʻrovda
/// bazadan. Faolsizlantirilgan xodimning ochiq sessiyasi ham shu yerda
/// toʻxtaydi: hisob oʻchirilganda kirish darhol tugashi kerak
export async function foydalanuvchiRuxsatlari(
  db: Db,
  clinicId: string,
  userId: string,
): Promise<readonly Ruxsat[]> {
  return klinikaSessiyasi(db, clinicId, async (tx) => {
    const u = await repo.oqiFoydalanuvchi(tx, userId)
    if (!u) throw xato.unauthorized()
    if (u.status !== 'active') throw xato.forbidden(AUTH.hisob_faolsiz)
    if (!u.roleId) return []
    return clinics.ruxsatlarniOl(tx, u.roleId)
  })
}

export async function men(deps: AuthDeps, sessiya: SessiyaMazmuni) {
  if (!sessiya.clinicId) throw xato.forbidden() // Platforma admini — bosqich 5.2

  const clinicId = sessiya.clinicId
  return klinikaSessiyasi(deps.db, clinicId, async (tx) => {
    const u = await repo.oqiFoydalanuvchi(tx, sessiya.userId)
    if (!u) throw xato.unauthorized()

    const klinika = await clinics.oqiKlinika(tx, clinicId)
    const rol = u.roleId ? await clinics.oqiRol(tx, u.roleId) : null

    return {
      user: { id: u.id, email: u.email, fullName: u.fullName },
      clinic: klinika,
      role: rol ? { name: rol.name, template: rol.template, isOwner: rol.isOwner } : null,
      permissions: rol?.permissions ?? [],
    }
  })
}
