import { AUDIT_LABELS } from '@e-dentist/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AUDIT_ACTION } from '../../platform/audit.js'
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

interface ClinicSummary {
  id: string
  name: string
  expiresAt: string
  status: string
  isTrial: boolean
  staffCount: number
  expired: boolean
}

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

describe('klinikalar roʻyxati', () => {
  it('roʻyxatda klinika va xodimlar soni koʻrinadi', async () => {
    const r = await asAdmin('GET', '/api/admin/clinics')
    expect(r.statusCode).toBe(200)

    const rows: ClinicSummary[] = r.json().data
    const mine = rows.find((row) => row.id === h.clinicId)
    expect(mine?.staffCount).toBeGreaterThanOrEqual(1)
    expect(mine?.isTrial).toBe(true)
  })

  it('nom boʻyicha qidiriladi', async () => {
    const clinic = await h.ownerDb.clinic.findUnique({ where: { id: h.clinicId } })
    const rows: ClinicSummary[] = (
      await asAdmin('GET', `/api/admin/clinics?search=${encodeURIComponent(clinic?.name ?? '')}`)
    ).json().data
    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe(h.clinicId)
  })

  // Panel bemor maʼlumotini koʻrmaydi — bu baza kafolati (tz.md 11-boʻlim)
  it('roʻyxatda bemor maʼlumoti yoʻq', async () => {
    await h.app.inject({
      method: 'POST',
      url: '/api/patients',
      headers: { cookie: h.cookie },
      payload: { fio: 'Maxfiy Bemor', phone: '901112233' },
    })

    const raw = (await asAdmin('GET', '/api/admin/clinics')).payload
    expect(raw).not.toContain('Maxfiy Bemor')
    expect(raw).not.toContain('901112233')
  })

  it('kartochkada hajm koʻrsatkichlari va xodimlar bor', async () => {
    const card = (await asAdmin('GET', `/api/admin/clinics/${h.clinicId}`)).json().data
    expect(card.patientCount).toBeGreaterThan(0)
    expect(card.staff.map((row: { email: string }) => row.email)).toContain(h.email)
    // Parol xeshi hech qachon chiqmaydi
    expect(JSON.stringify(card)).not.toMatch(/passwordHash|password_hash/)
  })

  it('kartochkada bemor ismlari yoʻq', async () => {
    const raw = (await asAdmin('GET', `/api/admin/clinics/${h.clinicId}`)).payload
    expect(raw).not.toContain('Maxfiy Bemor')
  })

  it('yoʻq klinika 404', async () => {
    const r = await asAdmin('GET', '/api/admin/clinics/01a08000-0000-7000-8000-000000000000')
    expect(r.statusCode).toBe(404)
  })
})

describe('muddat va bloklash', () => {
  it('muddat uzaytiriladi va sinov tugaydi', async () => {
    const before = (await asAdmin('GET', `/api/admin/clinics/${h.clinicId}`)).json().data
    const card = (
      await asAdmin('POST', `/api/admin/clinics/${h.clinicId}/extend`, { days: 30 })
    ).json().data

    expect(new Date(card.expiresAt) > new Date(before.expiresAt)).toBe(true)
    // Toʻlov qilindi degani — endi sinov emas
    expect(card.isTrial).toBe(false)
  })

  // Muddati oʻtgan klinikaga qoʻshilsa yangi muddat bugundan boshlanadi,
  // aks holda uzaytirish oʻtmishga tushib qolardi
  it('muddati oʻtgan klinikada bugundan boshlanadi', async () => {
    await h.ownerDb.clinic.update({
      where: { id: h.clinicId },
      data: { expiresAt: new Date('2020-01-01') },
    })

    const card = (
      await asAdmin('POST', `/api/admin/clinics/${h.clinicId}/extend`, { days: 10 })
    ).json().data
    const expected = new Date()
    expected.setDate(expected.getDate() + 10)
    expect(card.expiresAt).toBe(expected.toISOString().slice(0, 10))
  })

  it('notoʻgʻri kun soni rad etiladi', async () => {
    for (const days of [0, -5, 400]) {
      const r = await asAdmin('POST', `/api/admin/clinics/${h.clinicId}/extend`, { days })
      expect(r.statusCode, String(days)).toBe(400)
    }
  })

  it('bloklash klinikaga yozishni yopadi', async () => {
    const blocked = (
      await asAdmin('POST', `/api/admin/clinics/${h.clinicId}/status`, { status: 'blocked' })
    ).json().data
    expect(blocked.status).toBe('blocked')

    const write = await h.app.inject({
      method: 'POST',
      url: '/api/patients',
      headers: { cookie: h.cookie },
      payload: { fio: 'Bloklangandan Keyin' },
    })
    expect(write.statusCode).toBe(403)

    const active = (
      await asAdmin('POST', `/api/admin/clinics/${h.clinicId}/status`, { status: 'active' })
    ).json().data
    expect(active.status).toBe('active')
  })

  // Amal klinikaning oʻz tarixida qoladi — egasi ham koʻradi
  it('paneldagi amallar tarixga yoziladi', async () => {
    const card = (await asAdmin('GET', `/api/admin/clinics/${h.clinicId}`)).json().data
    const actions = card.history.map((row: { action: string }) => row.action)
    expect(actions).toContain('subscription_extended')
    expect(actions).toContain('clinic_blocked')
  })

  it('tarixda yozuv identifikatorlari yoʻq', async () => {
    const card = (await asAdmin('GET', `/api/admin/clinics/${h.clinicId}`)).json().data
    for (const row of card.history) {
      expect(Object.keys(row).sort()).toEqual(['action', 'actor', 'at'])
    }
  })

  it('klinika xodimi bu marshrutlarga yeta olmaydi', async () => {
    const r = await h.app.inject({
      method: 'POST',
      url: `/api/admin/clinics/${h.clinicId}/extend`,
      headers: { cookie: h.cookie },
      payload: { days: 365 },
    })
    expect(r.statusCode).toBe(403)
  })
})

describe('tarix nomlari', () => {
  // Panelda inglizcha kalit koʻrinib qolmasin: har bir amal nomi
  // shared dagi roʻyxatda boʻlishi kerak
  it('har bir audit amali uchun oʻzbekcha nom bor', () => {
    for (const action of Object.values(AUDIT_ACTION)) {
      expect(AUDIT_LABELS, action).toHaveProperty(action)
    }
  })
})
