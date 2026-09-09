import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Harness, startHarness } from '../../test-support/harness.js'
import { subscriptionOf } from './service.js'

let h: Harness
let patientId = ''

function call(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) {
  return h.app.inject({ method, url, payload, headers: { cookie: h.cookie } })
}

/// Klinikaning muddatini oʻzgartiradi — obuna tugagan holatni yasash uchun
function setExpiry(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return h.ownerDb.clinic.update({
    where: { id: h.clinicId },
    data: { expiresAt: new Date(date.toISOString().slice(0, 10)) },
  })
}

/// Alohida sessiya: chiqish sinovi harnessning cookie sini yopmasin
async function freshSession(): Promise<string> {
  const login = await h.app.inject({
    method: 'POST',
    url: '/api/auth/login',
    remoteAddress: h.clientIp,
    payload: { email: h.email, password: 'juda-yaxshi-parol' },
  })
  return `ed_session=${login.cookies.find((c) => c.name === 'ed_session')?.value}`
}

beforeAll(async () => {
  h = await startHarness()
  patientId = (await call('POST', '/api/patients', { fio: 'Obuna Bemori' })).json().data.id
}, 30_000)

afterAll(async () => {
  await setExpiry(30)
  await h.stop()
})

describe('subscriptionOf', () => {
  const active = { expiresAt: new Date('2030-01-01'), isTrial: false, status: 'active' }

  it('muddati bor klinika yozishi mumkin', () => {
    expect(subscriptionOf(active).readOnly).toBe(false)
  })

  it('bloklangan klinika faqat oʻqiydi', () => {
    expect(subscriptionOf({ ...active, status: 'blocked' })).toMatchObject({
      blocked: true,
      readOnly: true,
    })
  })

  // «Shu kungacha» — oxirgi kunning oʻzida obuna hali ochiq
  it('oxirgi kun hali ochiq', () => {
    const today = new Date()
    expect(subscriptionOf({ ...active, expiresAt: today }).readOnly).toBe(false)
  })

  it('kechagi sana bilan yopiq', () => {
    const yesterday = new Date(Date.now() - 86_400_000)
    expect(subscriptionOf({ ...active, expiresAt: yesterday }).readOnly).toBe(true)
  })
})

describe('muddat tugaganda', () => {
  beforeAll(async () => {
    await setExpiry(-1)
  })

  afterAll(async () => {
    await setExpiry(30)
  })

  it('yangi yozuv qoʻshib boʻlmaydi', async () => {
    const r = await call('POST', '/api/patients', { fio: 'Yangi Bemor' })
    expect(r.statusCode).toBe(403)
    expect(r.json().error.message).toMatch(/faqat oʻqish/)
  })

  it('tahrirlash va oʻchirish ham yopiq', async () => {
    expect((await call('PATCH', `/api/patients/${patientId}`, { fio: 'Boshqa' })).statusCode).toBe(
      403,
    )
    expect((await call('DELETE', `/api/patients/${patientId}`)).statusCode).toBe(403)
  })

  // Maʼlumot koʻrinadi va eksport qilinadi — bu qoida tz.md da qatʼiy
  it('oʻqish ochiq qoladi', async () => {
    expect((await call('GET', '/api/patients')).statusCode).toBe(200)
    expect((await call('GET', `/api/patients/${patientId}`)).statusCode).toBe(200)
  })

  it('eksport ochiq qoladi', async () => {
    expect((await call('GET', '/api/export')).statusCode).toBe(200)
  })

  // Chiqish sinovi harnessning sessiyasini yopib qoʻymasin — oʻzimizga
  // alohida sessiya ochamiz
  it('kabinetdan chiqish ochiq qoladi', async () => {
    const cookie = await freshSession()
    const r = await h.app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie } })
    expect(r.statusCode).toBe(200)
  })

  it('/me obuna holatini aytadi', async () => {
    const cookie = await freshSession()
    const me = await h.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })
    expect(me.json().data.subscription).toMatchObject({ readOnly: true, blocked: false })
  })

  // Maʼlumot hech qachon oʻchirilmaydi (tz.md 8-boʻlim)
  it('maʼlumot joyida qoladi', async () => {
    const patients = await h.ownerDb.patient.count({ where: { clinicId: h.clinicId } })
    expect(patients).toBeGreaterThan(0)
  })
})

describe('muddat uzaytirilgach', () => {
  it('yozish darhol ochiladi — qayta kirish shart emas', async () => {
    await setExpiry(-1)
    expect((await call('POST', '/api/patients', { fio: 'Muddatsiz' })).statusCode).toBe(403)

    await setExpiry(30)
    const r = await call('POST', '/api/patients', { fio: 'Muddat Uzaytirildi' })
    expect(r.statusCode).toBe(200)
  })
})

describe('bloklangan klinika', () => {
  it('yozish yopiq, oʻqish ochiq', async () => {
    await h.ownerDb.clinic.update({ where: { id: h.clinicId }, data: { status: 'blocked' } })

    const write = await call('POST', '/api/patients', { fio: 'Bloklangan Klinika' })
    expect(write.statusCode).toBe(403)
    expect(write.json().error.message).toMatch(/bloklangan/)
    expect((await call('GET', '/api/patients')).statusCode).toBe(200)

    await h.ownerDb.clinic.update({ where: { id: h.clinicId }, data: { status: 'active' } })
  })
})
