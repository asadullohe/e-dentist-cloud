// Auth moduli — uchidan uchiga. Haqiqiy baza va Redis bilan ishlaydi,
// xat esa xotirada ushlanadi: tasdiqlash havolasini oʻsha yerdan olamiz.

import { addDays } from '@e-dentist/shared'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createDb, type Db } from '../../platform/db.js'
import { memoryMailer } from '../../platform/mailer.js'
import { createRateLimiter } from '../../platform/rateLimit.js'
import { createServer } from '../../platform/server.js'
import { createSessionStore } from '../../platform/session.js'
import { fakeStorage, testConfig } from '../../test-support/config.js'

const ownerUrl = process.env.DATABASE_URL
const appUrl = process.env.APP_DATABASE_URL
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
if (!ownerUrl || !appUrl) throw new Error('DATABASE_URL va APP_DATABASE_URL kerak')

const config = testConfig()

const EMAIL = `sinov-${Date.now()}@example.com`
const CLINIC = `Sinov klinikasi ${Date.now()}`
// Test fayllari parallel ishlaydi — IP chegarasi boshqalarniki bilan
// aralashmasligi uchun shu faylning oʻz manzili
const CLIENT_IP = '10.255.0.1'
const LIMIT_EMAIL = `cheklov-${Date.now()}@example.com`

let app: FastifyInstance
let ownerDb: Db
let db: Db
let sessions: ReturnType<typeof createSessionStore>
let rateLimiter: ReturnType<typeof createRateLimiter>
const mailer = memoryMailer()
let clinicId = ''

function lastToken(): string {
  const body = mailer.sent.at(-1)?.body ?? ''
  return /token=([\w-]+)/.exec(body)?.[1] ?? ''
}

beforeAll(async () => {
  ownerDb = createDb(ownerUrl as string)
  db = createDb(appUrl as string)
  sessions = createSessionStore(redisUrl)
  rateLimiter = createRateLimiter(redisUrl)

  // Hisoblagichlar Redis da qoladi — oldingi ishga tushirishdan
  // qolgani testni yiqitmasin
  for (const k of [
    `register:ip:${CLIENT_IP}`,
    `login:ip:${CLIENT_IP}`,
    `login:account:${EMAIL}`,
    `login:account:${LIMIT_EMAIL}`,
  ]) {
    await rateLimiter.reset(k)
  }

  app = createServer(config, { db, storage: fakeStorage, sessions, rateLimiter, mailer })

  // Ruxsat tekshiruvini sinash uchun himoyalangan marshrut
  app.get('/sinov/bemorlar', { preHandler: app.requirePermission('patients.read') }, async () => ({
    ok: true,
  }))
  await app.ready()
})

afterAll(async () => {
  if (clinicId) {
    await ownerDb.auditLog.deleteMany({ where: { clinicId } })
    await ownerDb.user.deleteMany({ where: { clinicId } })
    await ownerDb.role.deleteMany({ where: { clinicId } })
    await ownerDb.clinic.deleteMany({ where: { id: clinicId } })
  }
  await app.close()
  await sessions.close()
  await rateLimiter.close()
  await ownerDb.$disconnect()
  await db.$disconnect()
})

describe('roʻyxatdan oʻtish', () => {
  it('klinika, beshta rol va egasi yaratiladi', async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        clinicName: CLINIC,
        phone: '901234567',
        fullName: 'Karimov Aziz',
        email: EMAIL,
        password: 'juda-yaxshi-parol',
      },
    })
    expect(r.statusCode).toBe(200)
    clinicId = r.json().data.clinicId

    const clinic = await ownerDb.clinic.findUnique({ where: { id: clinicId } })
    expect(clinic?.name).toBe(CLINIC)
    expect(clinic?.isTrial).toBe(true)

    const roles = await ownerDb.role.findMany({ where: { clinicId } })
    expect(roles).toHaveLength(5)

    const owner = await ownerDb.user.findFirst({ where: { clinicId }, include: { role: true } })
    expect(owner?.email).toBe(EMAIL)
    expect(owner?.role?.isOwner).toBe(true)
    expect(owner?.emailVerifiedAt).toBeNull()
  })

  it('sinov muddati 14 kun — DATE ustunida kun surilib ketmaydi', async () => {
    const clinic = await ownerDb.clinic.findUnique({ where: { id: clinicId } })
    expect(clinic?.expiresAt.toISOString().slice(0, 10)).toBe(
      addDays(14).toISOString().slice(0, 10),
    )
  })

  it('parol ochiq saqlanmaydi', async () => {
    const owner = await ownerDb.user.findFirst({ where: { clinicId } })
    expect(owner?.passwordHash).not.toContain('juda-yaxshi-parol')
    expect(owner?.passwordHash.startsWith('$argon2id$')).toBe(true)
  })

  it('tasdiqlash xati yuboriladi, kalit esa bazada xesh holida', async () => {
    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0]?.to).toBe(EMAIL)
    const key = lastToken()
    expect(key.length).toBeGreaterThan(20)

    const owner = await ownerDb.user.findFirst({ where: { clinicId } })
    expect(owner?.emailVerifyTokenHash).not.toBe(key)
    expect(owner?.emailVerifyTokenHash).toHaveLength(64)
  })

  it('bir xil pochta bilan ikkinchi marta oʻtib boʻlmaydi', async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        clinicName: 'Boshqa klinika',
        fullName: 'Boshqa Odam',
        email: EMAIL,
        password: 'juda-yaxshi-parol',
      },
    })
    expect(r.statusCode).toBe(409)
    expect(r.json().error.message).toBe('Bu pochta manzili allaqachon roʻyxatdan oʻtgan')
  })

  it('notoʻgʻri maʼlumot maydon boʻyicha rad etiladi', async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/register',
      payload: { clinicName: 'X', fullName: 'Ab', email: 'pochta-emas', password: '123' },
    })
    expect(r.statusCode).toBe(400)
    const f = r.json().error.fields
    expect(f.clinicName).toBe('Klinika nomi kamida 2 belgi boʻlsin')
    expect(f.email).toBe('Pochta manzili notoʻgʻri yozilgan')
    expect(f.password).toBe('Parol kamida 8 belgidan iborat boʻlsin')
  })
})

describe('pochtani tasdiqlash', () => {
  it('tasdiqlanmaguncha kirib boʻlmaydi', async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: EMAIL, password: 'juda-yaxshi-parol' },
    })
    expect(r.statusCode).toBe(403)
    expect(r.json().error.message).toMatch(/pochtangizni tasdiqlang/)
  })

  it('yaroqsiz kalit rad etiladi', async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/verify',
      payload: { token: 'bunday-kalit-yoq-albatta' },
    })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.message).toBe('Havola yaroqsiz yoki muddati oʻtgan')
  })

  it('toʻgʻri kalit bilan tasdiqlanadi', async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/verify',
      payload: { token: lastToken() },
    })
    expect(r.statusCode).toBe(200)

    const owner = await ownerDb.user.findFirst({ where: { clinicId } })
    expect(owner?.emailVerifiedAt).not.toBeNull()
  })

  // Havola ikki marta ochilishi oddiy hol: React StrictMode effektni ikki
  // marta chaqiradi, baʼzi pochta mijozlari esa havolani oldindan ochadi.
  // Ikkinchi murojaat xato bermasligi kerak
  it('havola ikki marta ochilsa ham xato bermaydi', async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/verify',
      payload: { token: lastToken() },
    })
    expect(r.statusCode).toBe(200)
  })

  it('tasdiqlangan vaqt birinchi martadagicha qoladi', async () => {
    const owner = await ownerDb.user.findFirst({ where: { clinicId } })
    const first = owner?.emailVerifiedAt
    await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/verify',
      payload: { token: lastToken() },
    })
    const after = await ownerDb.user.findFirst({ where: { clinicId } })
    expect(after?.emailVerifiedAt?.getTime()).toBe(first?.getTime())
  })
})

describe('kirish va sessiya', () => {
  let cookie = ''

  it('toʻgʻri parol bilan kiriladi va cookie beriladi', async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: EMAIL, password: 'juda-yaxshi-parol' },
    })
    expect(r.statusCode).toBe(200)

    const c = r.cookies.find((x) => x.name === 'ed_session')
    expect(c).toBeDefined()
    expect(c?.httpOnly).toBe(true)
    expect(c?.sameSite?.toLowerCase()).toBe('lax')
    cookie = `ed_session=${c?.value}`
  })

  it('notoʻgʻri parol va mavjud boʻlmagan pochta — bir xil xato', async () => {
    const wrong = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: EMAIL, password: 'boshqa-parol' },
    })
    const yoq = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'umuman-yoq@example.com', password: 'boshqa-parol' },
    })
    expect(wrong.statusCode).toBe(401)
    expect(yoq.statusCode).toBe(401)
    // Javoblar bir xil boʻlishi shart: aks holda qaysi pochta
    // roʻyxatdan oʻtganini bilib olish mumkin
    expect(wrong.json()).toEqual(yoq.json())
  })

  it('/api/me foydalanuvchi, klinika va ruxsatlarni qaytaradi', async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'GET',
      url: '/api/me',
      headers: { cookie },
    })
    expect(r.statusCode).toBe(200)
    const d = r.json().data
    expect(d.user.email).toBe(EMAIL)
    expect(d.clinic.name).toBe(CLINIC)
    expect(d.role.template).toBe('egasi')
    expect(d.permissions).toHaveLength(17)
    expect(d.permissions).toContain('staff.manage')
  })

  it('cookie siz /api/me yopiq', async () => {
    const r = await app.inject({ remoteAddress: CLIENT_IP, method: 'GET', url: '/api/me' })
    expect(r.statusCode).toBe(401)
    expect(r.json().error.message).toBe('Avval tizimga kiring')
  })

  it('chiqqandan keyin sessiya darhol ishlamaydi', async () => {
    const logout = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie },
    })
    expect(logout.statusCode).toBe(200)

    const after = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'GET',
      url: '/api/me',
      headers: { cookie },
    })
    expect(after.statusCode).toBe(401)
  })
})

describe('ruxsat tekshiruvi', () => {
  let cookie = ''

  beforeAll(async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: EMAIL, password: 'juda-yaxshi-parol' },
    })
    cookie = `ed_session=${r.cookies.find((x) => x.name === 'ed_session')?.value}`
  })

  it('egasida patients.read bor — oʻtadi', async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'GET',
      url: '/sinov/bemorlar',
      headers: { cookie },
    })
    expect(r.statusCode).toBe(200)
  })

  it('kirmagan foydalanuvchi 401 oladi, 403 emas', async () => {
    const r = await app.inject({ remoteAddress: CLIENT_IP, method: 'GET', url: '/sinov/bemorlar' })
    expect(r.statusCode).toBe(401)
  })

  // Eng muhim test: ruxsat sessiyada emas, bazadan oʻqiladi. Rol olib
  // qoʻyilganda xodim qayta kirmasdan ham darhol toʻsilishi kerak
  it('rol almashtirilsa — oʻsha zahoti toʻsiladi, qayta kirish shart emas', async () => {
    const techRole = await ownerDb.role.findFirst({ where: { clinicId, template: 'texnik' } })
    const owner = await ownerDb.role.findFirst({ where: { clinicId, template: 'egasi' } })
    const user = await ownerDb.user.findFirst({ where: { clinicId } })

    await ownerDb.user.update({ where: { id: user?.id }, data: { roleId: techRole?.id } })
    const blocked = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'GET',
      url: '/sinov/bemorlar',
      headers: { cookie },
    })
    expect(blocked.statusCode).toBe(403)
    expect(blocked.json().error.message).toBe('Bu amal uchun ruxsatingiz yoʻq')

    await ownerDb.user.update({ where: { id: user?.id }, data: { roleId: owner?.id } })
    const again = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'GET',
      url: '/sinov/bemorlar',
      headers: { cookie },
    })
    expect(again.statusCode).toBe(200)
  })

  // Xodim ishdan boʻshaganda hisob oʻchirilmaydi, status = disabled boʻladi.
  // Uning ochiq sessiyasi oʻsha zahoti ishlamay qolishi kerak
  it('faolsizlantirilgan xodimning ochiq sessiyasi ham toʻxtaydi', async () => {
    const user = await ownerDb.user.findFirst({ where: { clinicId } })
    await ownerDb.user.update({ where: { id: user?.id }, data: { status: 'disabled' } })

    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'GET',
      url: '/sinov/bemorlar',
      headers: { cookie },
    })
    expect(r.statusCode).toBe(403)
    expect(r.json().error.message).toMatch(/faolsizlantirilgan/)

    await ownerDb.user.update({ where: { id: user?.id }, data: { status: 'active' } })
  })
})

describe('urinishlar cheklovi', () => {
  it('bir martalik pochta rad etiladi', async () => {
    const r = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        clinicName: 'Vaqtinchalik klinika',
        fullName: 'Vaqtinchalik Odam',
        email: 'kimdir@mailinator.com',
        password: 'juda-yaxshi-parol',
      },
    })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.email).toBe('Bir martalik pochta xizmatlari qabul qilinmaydi')
  })

  it('5 ta notoʻgʻri urinishdan keyin hisob vaqtincha toʻsiladi', async () => {
    const hit = () =>
      app.inject({
        remoteAddress: CLIENT_IP,
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: LIMIT_EMAIL, password: 'notogri' },
      })

    for (let i = 0; i < 5; i++) {
      expect((await hit()).statusCode).toBe(401)
    }
    const sixth = await hit()
    expect(sixth.statusCode).toBe(429)
    expect(sixth.json().error.code).toBe('rate_limited')
    expect(sixth.json().error.message).toMatch(/Juda koʻp urinish/)
  })

  it('muvaffaqiyatli kirish hisoblagichni tozalaydi', async () => {
    for (let i = 0; i < 3; i++) {
      await app.inject({
        remoteAddress: CLIENT_IP,
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: EMAIL, password: 'notogri' },
      })
    }
    const loggedIn = await app.inject({
      remoteAddress: CLIENT_IP,
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: EMAIL, password: 'juda-yaxshi-parol' },
    })
    expect(loggedIn.statusCode).toBe(200)

    // Tozalangan boʻlsa, yana besh urinishga joy bor
    for (let i = 0; i < 3; i++) {
      const r = await app.inject({
        remoteAddress: CLIENT_IP,
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: EMAIL, password: 'notogri' },
      })
      expect(r.statusCode).toBe(401)
    }
  })
})

describe('audit yozuvlari', () => {
  it('roʻyxatdan oʻtish, tasdiqlash, kirish va xato urinish yozilgan', async () => {
    const entries = await ownerDb.auditLog.findMany({ where: { clinicId }, orderBy: { at: 'asc' } })
    const actions = entries.map((y) => y.action)
    expect(actions).toContain('registered')
    expect(actions).toContain('email_verified')
    expect(actions).toContain('logged_in')
    expect(actions).toContain('login_failed')
    expect(actions).toContain('logged_out')
  })

  it('IP yozilgan, lekin parol yoki kalit yozilmagan', async () => {
    const register = await ownerDb.auditLog.findFirst({ where: { clinicId, action: 'registered' } })
    expect((register?.meta as { ip?: string })?.ip).toBeTruthy()
    const everything = JSON.stringify(await ownerDb.auditLog.findMany({ where: { clinicId } }))
    expect(everything).not.toContain('juda-yaxshi-parol')
    expect(everything).not.toContain('$argon2id$')
  })
})
