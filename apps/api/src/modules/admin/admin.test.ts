import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { hashPassword } from '../../platform/password.js'
import { uuidV7 } from '../../platform/uuid.js'
import { type Harness, startHarness } from '../../test-support/harness.js'

let h: Harness
let adminCookie = ''
let adminId = ''
const adminEmail = `admin-${Date.now()}@example.com`

beforeAll(async () => {
  h = await startHarness()

  // Platforma admini: klinikasi ham, roli ham yoʻq
  adminId = uuidV7()
  await h.ownerDb.user.create({
    data: {
      id: adminId,
      email: adminEmail,
      passwordHash: await hashPassword('juda-yaxshi-admin-paroli'),
      fullName: 'Platforma Admini',
      emailVerifiedAt: new Date(),
    },
  })

  const login = await h.app.inject({
    method: 'POST',
    url: '/api/auth/login',
    remoteAddress: h.clientIp,
    payload: { email: adminEmail, password: 'juda-yaxshi-admin-paroli' },
  })
  adminCookie = `ed_session=${login.cookies.find((c) => c.name === 'ed_session')?.value}`
}, 30_000)

afterAll(async () => {
  await h.ownerDb.user.delete({ where: { id: adminId } })
  await h.stop()
})

function asAdmin(method: 'GET' | 'POST', url: string, payload?: object) {
  return h.app.inject({ method, url, payload, headers: { cookie: adminCookie } })
}

describe('platforma admini', () => {
  it('kira oladi va oʻzini koʻradi', async () => {
    const r = await asAdmin('GET', '/api/admin/me')
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({ email: adminEmail, fullName: 'Platforma Admini' })
  })

  // Eng muhim chegara: admin klinikaning bemor maʼlumotiga yeta olmaydi
  it('bemorlar moduli umuman ochilmaydi', async () => {
    for (const url of [
      '/api/patients',
      '/api/queue',
      '/api/reports?month=2026-09',
      '/api/export',
    ]) {
      expect((await asAdmin('GET', url)).statusCode, url).toBe(403)
    }
  })

  it('bemor qoʻsha olmaydi', async () => {
    expect((await asAdmin('POST', '/api/patients', { fio: 'Admin Bemori' })).statusCode).toBe(403)
  })

  it('/me klinika javobini bera olmaydi', async () => {
    expect((await asAdmin('GET', '/api/me')).statusCode).toBe(403)
  })

  it('klinika xodimi boshqaruv paneliga kira olmaydi', async () => {
    const r = await h.app.inject({
      method: 'GET',
      url: '/api/admin/me',
      headers: { cookie: h.cookie },
    })
    expect(r.statusCode).toBe(403)
  })

  it('kirmagan odam ham kira olmaydi', async () => {
    expect((await h.app.inject({ method: 'GET', url: '/api/admin/me' })).statusCode).toBe(401)
  })

  it('faolsizlantirilgan admin yopiladi', async () => {
    await h.ownerDb.user.update({ where: { id: adminId }, data: { status: 'disabled' } })
    expect((await asAdmin('GET', '/api/admin/me')).statusCode).toBe(401)
    await h.ownerDb.user.update({ where: { id: adminId }, data: { status: 'active' } })
  })
})
