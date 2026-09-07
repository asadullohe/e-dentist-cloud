// Auth moduli — uchidan uchiga. Haqiqiy baza va Redis bilan ishlaydi,
// xat esa xotirada ushlanadi: tasdiqlash havolasini oʻsha yerdan olamiz.

import { kunQoshib } from '@e-dentist/shared'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Config } from '../../platform/config.js'
import { type Db, yaratDb } from '../../platform/db.js'
import { xotiraPochtasi } from '../../platform/pochta.js'
import { yaratServer } from '../../platform/server.js'
import { yaratSessiyaSaqlagich } from '../../platform/sessiya.js'

const egaUrl = process.env.DATABASE_URL
const appUrl = process.env.APP_DATABASE_URL
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
if (!egaUrl || !appUrl) throw new Error('DATABASE_URL va APP_DATABASE_URL kerak')

const config: Config = {
  NODE_ENV: 'test',
  API_PORT: 3000,
  TZ: 'Asia/Tashkent',
  CABINET_URL: 'http://localhost:5173',
  DATABASE_URL: egaUrl,
  APP_DATABASE_URL: appUrl,
  REDIS_URL: redisUrl,
  SESSION_SECRET: 'x'.repeat(16),
}

const POCHTA = `sinov-${Date.now()}@example.com`
const KLINIKA = `Sinov klinikasi ${Date.now()}`

let app: FastifyInstance
let ega: Db
let db: Db
let sessiyalar: ReturnType<typeof yaratSessiyaSaqlagich>
const pochta = xotiraPochtasi()
let clinicId = ''

function kalitniOl(): string {
  const matn = pochta.xatlar.at(-1)?.matn ?? ''
  return /kalit=([\w-]+)/.exec(matn)?.[1] ?? ''
}

beforeAll(async () => {
  ega = yaratDb(egaUrl as string)
  db = yaratDb(appUrl as string)
  sessiyalar = yaratSessiyaSaqlagich(redisUrl)
  app = yaratServer(config, { db, sessiyalar, pochta })
  await app.ready()
})

afterAll(async () => {
  if (clinicId) {
    await ega.auditLog.deleteMany({ where: { clinicId } })
    await ega.user.deleteMany({ where: { clinicId } })
    await ega.role.deleteMany({ where: { clinicId } })
    await ega.clinic.deleteMany({ where: { id: clinicId } })
  }
  await app.close()
  await sessiyalar.yop()
  await ega.$disconnect()
  await db.$disconnect()
})

describe('roʻyxatdan oʻtish', () => {
  it('klinika, beshta rol va egasi yaratiladi', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        clinicName: KLINIKA,
        phone: '901234567',
        fullName: 'Karimov Aziz',
        email: POCHTA,
        password: 'juda-yaxshi-parol',
      },
    })
    expect(r.statusCode).toBe(200)
    clinicId = r.json().data.clinicId

    const klinika = await ega.clinic.findUnique({ where: { id: clinicId } })
    expect(klinika?.name).toBe(KLINIKA)
    expect(klinika?.isTrial).toBe(true)

    const rollar = await ega.role.findMany({ where: { clinicId } })
    expect(rollar).toHaveLength(5)

    const egasi = await ega.user.findFirst({ where: { clinicId }, include: { role: true } })
    expect(egasi?.email).toBe(POCHTA)
    expect(egasi?.role?.isOwner).toBe(true)
    expect(egasi?.emailVerifiedAt).toBeNull()
  })

  it('sinov muddati 14 kun — DATE ustunida kun surilib ketmaydi', async () => {
    const klinika = await ega.clinic.findUnique({ where: { id: clinicId } })
    expect(klinika?.expiresAt.toISOString().slice(0, 10)).toBe(
      kunQoshib(14).toISOString().slice(0, 10),
    )
  })

  it('parol ochiq saqlanmaydi', async () => {
    const egasi = await ega.user.findFirst({ where: { clinicId } })
    expect(egasi?.passwordHash).not.toContain('juda-yaxshi-parol')
    expect(egasi?.passwordHash.startsWith('$argon2id$')).toBe(true)
  })

  it('tasdiqlash xati yuboriladi, kalit esa bazada xesh holida', async () => {
    expect(pochta.xatlar).toHaveLength(1)
    expect(pochta.xatlar[0]?.kimga).toBe(POCHTA)
    const kalit = kalitniOl()
    expect(kalit.length).toBeGreaterThan(20)

    const egasi = await ega.user.findFirst({ where: { clinicId } })
    expect(egasi?.emailVerifyTokenHash).not.toBe(kalit)
    expect(egasi?.emailVerifyTokenHash).toHaveLength(64)
  })

  it('bir xil pochta bilan ikkinchi marta oʻtib boʻlmaydi', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        clinicName: 'Boshqa klinika',
        fullName: 'Boshqa Odam',
        email: POCHTA,
        password: 'juda-yaxshi-parol',
      },
    })
    expect(r.statusCode).toBe(409)
    expect(r.json().error.message).toBe('Bu pochta manzili allaqachon roʻyxatdan oʻtgan')
  })

  it('notoʻgʻri maʼlumot maydon boʻyicha rad etiladi', async () => {
    const r = await app.inject({
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
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: POCHTA, password: 'juda-yaxshi-parol' },
    })
    expect(r.statusCode).toBe(403)
    expect(r.json().error.message).toMatch(/pochtangizni tasdiqlang/)
  })

  it('yaroqsiz kalit rad etiladi', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/auth/verify',
      payload: { token: 'bunday-kalit-yoq-albatta' },
    })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.message).toBe('Havola yaroqsiz yoki muddati oʻtgan')
  })

  it('toʻgʻri kalit bilan tasdiqlanadi', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/auth/verify',
      payload: { token: kalitniOl() },
    })
    expect(r.statusCode).toBe(200)

    const egasi = await ega.user.findFirst({ where: { clinicId } })
    expect(egasi?.emailVerifiedAt).not.toBeNull()
    // Ishlatilgan kalit bazada qolmaydi
    expect(egasi?.emailVerifyTokenHash).toBeNull()
  })

  it('bitta kalit ikki marta ishlamaydi', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/auth/verify',
      payload: { token: kalitniOl() },
    })
    expect(r.statusCode).toBe(400)
  })
})

describe('kirish va sessiya', () => {
  let cookie = ''

  it('toʻgʻri parol bilan kiriladi va cookie beriladi', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: POCHTA, password: 'juda-yaxshi-parol' },
    })
    expect(r.statusCode).toBe(200)

    const c = r.cookies.find((x) => x.name === 'ed_sessiya')
    expect(c).toBeDefined()
    expect(c?.httpOnly).toBe(true)
    expect(c?.sameSite?.toLowerCase()).toBe('lax')
    cookie = `ed_sessiya=${c?.value}`
  })

  it('notoʻgʻri parol va mavjud boʻlmagan pochta — bir xil xato', async () => {
    const notogri = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: POCHTA, password: 'boshqa-parol' },
    })
    const yoq = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'umuman-yoq@example.com', password: 'boshqa-parol' },
    })
    expect(notogri.statusCode).toBe(401)
    expect(yoq.statusCode).toBe(401)
    // Javoblar bir xil boʻlishi shart: aks holda qaysi pochta
    // roʻyxatdan oʻtganini bilib olish mumkin
    expect(notogri.json()).toEqual(yoq.json())
  })

  it('/api/me foydalanuvchi, klinika va ruxsatlarni qaytaradi', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })
    expect(r.statusCode).toBe(200)
    const d = r.json().data
    expect(d.user.email).toBe(POCHTA)
    expect(d.clinic.name).toBe(KLINIKA)
    expect(d.role.template).toBe('egasi')
    expect(d.permissions).toHaveLength(17)
    expect(d.permissions).toContain('staff.manage')
  })

  it('cookie siz /api/me yopiq', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/me' })
    expect(r.statusCode).toBe(401)
    expect(r.json().error.message).toBe('Avval tizimga kiring')
  })

  it('chiqqandan keyin sessiya darhol ishlamaydi', async () => {
    const chiq = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie } })
    expect(chiq.statusCode).toBe(200)

    const keyin = await app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })
    expect(keyin.statusCode).toBe(401)
  })
})
