import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

let h: Harness
let patientId = ''
let doctorId = ''
let doctorCookie = ''
let adminId = ''
let otherClinicId = ''

interface Row {
  userId: string
  fullName: string
  visits: number
  charges: number
  percent: number
  share: number
  salary: number
  total: number
}

function call(method: 'GET' | 'POST' | 'PATCH', url: string, payload?: object, cookie = h.cookie) {
  return h.app.inject({ method, url, payload, headers: { cookie } })
}

async function payroll(month: string, cookie = h.cookie) {
  const r = await call('GET', `/api/payroll?month=${month}`, undefined, cookie)
  expect(r.statusCode).toBe(200)
  return r.json().data as {
    rows: Row[]
    totals: { charges: number; share: number; salary: number; total: number }
    unassigned: { visits: number; charges: number } | null
  }
}

beforeAll(async () => {
  h = await startHarness()

  const created = await call('POST', '/api/patients', { fio: 'Ish Haqi Bemori' })
  patientId = created.json().data.id

  const roles = (await call('GET', '/api/roles')).json().data as {
    id: string
    template: string
  }[]
  const doctorRole = roles.find((role) => role.template === 'shifokor')?.id
  const receptionRole = roles.find((role) => role.template === 'qabulxona')?.id

  // Shifokor 50%, administrator 3 mln oylik
  const doctor = await call('POST', '/api/staff', {
    email: `ishhaqi-shifokor-${h.clinicId.slice(0, 8)}@sinov.uz`,
    fullName: 'Aliyev Bobur',
    roleId: doctorRole,
    password: 'juda-yaxshi-parol',
    payPercent: 50,
  })
  doctorId = doctor.json().data.id
  const admin = await call('POST', '/api/staff', {
    email: `ishhaqi-admin-${h.clinicId.slice(0, 8)}@sinov.uz`,
    fullName: 'Karimova Nilufar',
    roleId: receptionRole,
    password: 'juda-yaxshi-parol',
    salaryAmount: 3_000_000,
  })
  adminId = admin.json().data.id

  const login = await h.app.inject({
    method: 'POST',
    url: '/api/auth/login',
    remoteAddress: h.clientIp,
    payload: {
      email: `ishhaqi-shifokor-${h.clinicId.slice(0, 8)}@sinov.uz`,
      password: 'juda-yaxshi-parol',
    },
  })
  doctorCookie = `ed_session=${login.cookies.find((c) => c.name === 'ed_session')?.value}`

  // 2026-04: shifokorda 300 000 + 200 000; egasida (foizsiz) 100 000
  for (const [date, price] of [
    ['2026-04-03', 300_000],
    ['2026-04-10', 200_000],
  ] as const) {
    await call('POST', '/api/visits', { patientId, doctorId, date, treatment: 'Plomba', price })
  }
  await call('POST', '/api/visits', {
    patientId,
    date: '2026-04-15',
    treatment: 'Koʻrik',
    price: 100_000,
  })
  // Boshqa oy — aprelga kirmasligi kerak
  await call('POST', '/api/visits', {
    patientId,
    doctorId,
    date: '2026-05-01',
    treatment: 'Plomba',
    price: 999_000,
  })

  // Shifokori yoʻq eski yozuv (9.1 dan oldingi)
  await h.ownerDb.visit.create({
    data: {
      clinicId: h.clinicId,
      patientId,
      date: new Date('2026-04-20'),
      treatment: 'Eski yozuv',
      price: 50_000,
    },
  })

  // B klinikasi — uning tashrifi bizning hisobga kirmasin
  const other = await createOtherClinic(h.ownerDb, 'B klinikasi')
  otherClinicId = other.id
  const otherPatient = await h.ownerDb.patient.create({
    data: { clinicId: otherClinicId, fio: 'Begona', fioSearch: 'begona' },
  })
  await h.ownerDb.visit.create({
    data: {
      clinicId: otherClinicId,
      patientId: otherPatient.id,
      doctorId,
      date: new Date('2026-04-05'),
      treatment: 'Begona ish',
      price: 5_000_000,
      doctorPercent: 50,
      doctorShare: 2_500_000,
    },
  })
}, 30_000)

afterAll(async () => {
  await removeClinic(h.ownerDb, otherClinicId)
  await h.stop()
})

describe('oylik hisob', () => {
  it('shifokor: tashriflar, ish summasi, ulush; administrator: oylik', async () => {
    const data = await payroll('2026-04')
    const doctor = data.rows.find((row) => row.userId === doctorId)
    expect(doctor).toMatchObject({
      fullName: 'Aliyev Bobur',
      visits: 2,
      charges: 500_000,
      percent: 50,
      share: 250_000,
      salary: 0,
      total: 250_000,
    })
    const admin = data.rows.find((row) => row.userId === adminId)
    expect(admin).toMatchObject({
      visits: 0,
      charges: 0,
      share: 0,
      salary: 3_000_000,
      total: 3_000_000,
    })

    // Egasi foizsiz — ishi bor, ulushi yoʻq
    const owner = data.rows.find((row) => row.userId === h.userId)
    expect(owner).toMatchObject({ visits: 1, charges: 100_000, share: 0 })
  })

  it('jami va shifokor koʻrsatilmagan tashriflar', async () => {
    const data = await payroll('2026-04')
    expect(data.totals.share).toBe(250_000)
    expect(data.totals.salary).toBe(3_000_000)
    expect(data.totals.total).toBe(3_250_000)
    expect(data.unassigned).toEqual({ visits: 1, charges: 50_000 })
  })

  it('boshqa oy alohida', async () => {
    const data = await payroll('2026-05')
    const doctor = data.rows.find((row) => row.userId === doctorId)
    expect(doctor).toMatchObject({ visits: 1, charges: 999_000, share: 499_500 })
    expect(data.unassigned).toBeNull()
  })
})

describe('ishlar roʻyxati', () => {
  it('bemor ismi, narx va ulush bilan', async () => {
    const r = await call('GET', `/api/payroll/visits?month=2026-04&userId=${doctorId}`)
    expect(r.statusCode).toBe(200)
    const rows = r.json().data as { patientName: string; price: number; share: number }[]
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      patientName: 'Ish Haqi Bemori',
      price: 200_000,
      share: 100_000,
    })
  })
})

describe('payroll.own — shifokor faqat oʻzini koʻradi', () => {
  it('roʻyxatda bitta qator, jami yoʻq, «koʻrsatilmagan» yoʻq', async () => {
    const data = await payroll('2026-04', doctorCookie)
    expect(data.rows.map((row) => row.userId)).toEqual([doctorId])
    expect(data.rows[0]?.share).toBe(250_000)
    expect(data.unassigned).toBeNull()
  })

  it('ishlar roʻyxati — userId siz oʻziniki, begona id ga 403', async () => {
    const own = await call('GET', '/api/payroll/visits?month=2026-04', undefined, doctorCookie)
    expect(own.statusCode).toBe(200)
    expect(own.json().data).toHaveLength(2)

    const foreign = await call(
      'GET',
      `/api/payroll/visits?month=2026-04&userId=${adminId}`,
      undefined,
      doctorCookie,
    )
    expect(foreign.statusCode).toBe(403)
  })

  it('qayta hisoblash — faqat payroll.manage', async () => {
    const r = await call(
      'POST',
      '/api/payroll/recalculate',
      { month: '2026-04', userId: doctorId },
      doctorCookie,
    )
    expect(r.statusCode).toBe(403)
  })
})

describe('qayta hisoblash', () => {
  it('oydagi tashriflarga joriy foiz yoziladi, boshqa oyga tegmaydi', async () => {
    await call('PATCH', `/api/staff/${doctorId}`, { payPercent: 40 })
    // Snapshot: hali eski
    expect((await payroll('2026-04')).rows.find((row) => row.userId === doctorId)?.share).toBe(
      250_000,
    )

    const r = await call('POST', '/api/payroll/recalculate', { month: '2026-04', userId: doctorId })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toEqual({ count: 2, percent: 40 })

    expect((await payroll('2026-04')).rows.find((row) => row.userId === doctorId)?.share).toBe(
      200_000,
    )
    expect((await payroll('2026-05')).rows.find((row) => row.userId === doctorId)?.share).toBe(
      499_500,
    )
  })

  it('begona klinika xodimi — topilmadi', async () => {
    const foreignUser = await h.ownerDb.user.findFirst({ where: { clinicId: otherClinicId } })
    const r = await call('POST', '/api/payroll/recalculate', {
      month: '2026-04',
      userId: foreignUser?.id ?? '00000000-0000-7000-8000-000000000000',
    })
    expect(r.statusCode).toBe(404)
  })
})

describe('ruxsat', () => {
  it('payroll ruxsati yoʻq rol (qabulxona) — 403', async () => {
    const login = await h.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      remoteAddress: h.clientIp,
      payload: {
        email: `ishhaqi-admin-${h.clinicId.slice(0, 8)}@sinov.uz`,
        password: 'juda-yaxshi-parol',
      },
    })
    const cookie = `ed_session=${login.cookies.find((c) => c.name === 'ed_session')?.value}`
    const r = await call('GET', '/api/payroll?month=2026-04', undefined, cookie)
    expect(r.statusCode).toBe(403)
  })
})
