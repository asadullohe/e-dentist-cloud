import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

let h: Harness
let patientId = ''
let otherClinicId = ''

interface Summary {
  visits: number
  charges: number
  payments: number
  expenses: number
  profit: number
  newPatients: number
}

function call(method: 'GET' | 'POST', url: string, payload?: object) {
  return h.app.inject({ method, url, payload, headers: { cookie: h.cookie } })
}

function report(month: string) {
  return call('GET', `/api/reports?month=${month}`).then((r) => r.json())
}

beforeAll(async () => {
  h = await startHarness()

  const created = await call('POST', '/api/patients', { fio: 'Hisobot Bemori' })
  patientId = created.json().data.id

  // 2026-03: ikki tashrif, bitta toʻlov, ikki xarajat
  await call('POST', '/api/visits', {
    patientId,
    date: '2026-03-05',
    treatment: 'Karies davolash',
    price: 400_000,
  })
  await call('POST', '/api/visits', {
    patientId,
    date: '2026-03-20',
    treatment: 'Tish olish',
    price: 150_000,
  })
  await call('POST', '/api/payments', { patientId, date: '2026-03-21', amount: 500_000 })
  await call('POST', '/api/expenses', {
    date: '2026-03-01',
    category: 'materials',
    description: 'Plomba',
    amount: 200_000,
  })
  await call('POST', '/api/expenses', {
    date: '2026-03-31',
    category: 'rent',
    description: 'Mart ijarasi',
    amount: 100_000,
  })

  // 2026-02: grafikda oldingi oy ham koʻrinishi kerak
  await call('POST', '/api/visits', {
    patientId,
    date: '2026-02-10',
    treatment: 'Koronka',
    price: 900_000,
  })

  const other = await createOtherClinic(h.ownerDb, 'B klinikasi')
  otherClinicId = other.id
}, 30_000)

afterAll(async () => {
  await removeClinic(h.ownerDb, otherClinicId)
  await h.stop()
})

describe('oylik jamlanma', () => {
  it('tashrif, tushum, xarajat va sof foyda', async () => {
    const summary: Summary = (await report('2026-03')).data.summary
    expect(summary.visits).toBe(2)
    expect(summary.charges).toBe(550_000)
    expect(summary.payments).toBe(500_000)
    expect(summary.expenses).toBe(300_000)
    // Sof foyda — qoʻlga tushgan pul minus xarajat, qilingan ish narxi emas
    expect(summary.profit).toBe(200_000)
  })

  it('boshqa oyning yozuvlari aralashmaydi', async () => {
    const summary: Summary = (await report('2026-02')).data.summary
    expect(summary.charges).toBe(900_000)
    expect(summary.payments).toBe(0)
    expect(summary.expenses).toBe(0)
    expect(summary.profit).toBe(0)
  })

  // Oyning oxirgi kuni chegaradan tushib qolmasin
  it('oyning oxirgi kunidagi xarajat shu oyga kiradi', async () => {
    const summary: Summary = (await report('2026-03')).data.summary
    expect(summary.expenses).toBe(300_000)
    const april: Summary = (await report('2026-04')).data.summary
    expect(april.expenses).toBe(0)
  })

  // Oy chegarasi klinika kuni boʻyicha: 1-may soat 01:00 (Toshkent) —
  // UTC da hali 30-aprel. Chegara UTC da olinsa bemor aprelga tushib qolardi
  it('yangi bemor klinika vaqti boʻyicha oyga tushadi', async () => {
    await h.ownerDb.patient.create({
      data: {
        clinicId: h.clinicId,
        fio: 'Tungi Bemor',
        fioSearch: 'tungi bemor',
        createdAt: new Date('2026-04-30T20:00:00Z'),
      },
    })

    expect((await report('2026-05')).data.summary.newPatients).toBe(1)
    expect((await report('2026-04')).data.summary.newPatients).toBe(0)
  })

  it('yangi bemorlar shu oy boʻyicha sanaladi', async () => {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const summary: Summary = (await report(month)).data.summary
    expect(summary.newPatients).toBeGreaterThanOrEqual(1)
  })
})

describe('davr boʻyicha (kun · hafta · yil)', () => {
  const range = (from: string, to: string) =>
    call('GET', `/api/reports?from=${from}&to=${to}`).then((r) => r.json())

  it('bir kun: faqat shu kunning tashrifi', async () => {
    const summary: Summary = (await range('2026-03-05', '2026-03-05')).data.summary
    expect(summary.visits).toBe(1)
    expect(summary.charges).toBe(400_000)
    expect(summary.payments).toBe(0)
  })

  it('hafta: chegaralar ikkala tomondan', async () => {
    // 16–22 mart: tashrif 20-mart, toʻlov 21-mart
    const summary: Summary = (await range('2026-03-16', '2026-03-22')).data.summary
    expect(summary.visits).toBe(1)
    expect(summary.charges).toBe(150_000)
    expect(summary.payments).toBe(500_000)
    expect(summary.expenses).toBe(0)
  })

  it('yil: hammasi kiradi, grafik oyna davr oxiri bilan tugaydi', async () => {
    const data = (await range('2026-01-01', '2026-12-31')).data
    expect(data.summary.charges).toBe(400_000 + 150_000 + 900_000)
    expect(data.summary.expenses).toBe(300_000)
    expect(data.months).toHaveLength(12)
    expect(data.months[11].month).toBe('2026-12')
    // Yil boshidagi fevral grafik oynasidan tashqarida boʻlsa ham jamlanmada bor
    expect(data.months.find((m: { month: string }) => m.month === '2026-02')?.charges).toBe(900_000)
  })

  it('teskari davr 400', async () => {
    expect((await call('GET', '/api/reports?from=2026-03-31&to=2026-03-01')).statusCode).toBe(400)
  })
})

describe('oxirgi 12 oy', () => {
  it('12 ta oy, oxirgisi tanlangani', async () => {
    const months = (await report('2026-03')).data.months
    expect(months).toHaveLength(12)
    expect(months[11].month).toBe('2026-03')
    expect(months[0].month).toBe('2025-04')
  })

  it('har oy oʻz summasi bilan', async () => {
    const months: { month: string; charges: number; payments: number; expenses: number }[] = (
      await report('2026-03')
    ).data.months

    const march = months.find((m) => m.month === '2026-03')
    const february = months.find((m) => m.month === '2026-02')
    expect(march).toEqual({
      month: '2026-03',
      charges: 550_000,
      payments: 500_000,
      expenses: 300_000,
    })
    expect(february?.charges).toBe(900_000)
    // Yozuvsiz oy ham qatorda turadi — grafikda boʻshliq boʻlmasin
    expect(months.find((m) => m.month === '2025-12')).toEqual({
      month: '2025-12',
      charges: 0,
      payments: 0,
      expenses: 0,
    })
  })
})

describe('roʻyxatlar', () => {
  it('muolajalar summasi boʻyicha tartiblangan', async () => {
    const rows = (await report('2026-03')).data.topTreatments
    expect(rows[0]).toEqual({ treatment: 'Karies davolash', count: 1, total: 400_000 })
    expect(rows[1]).toEqual({ treatment: 'Tish olish', count: 1, total: 150_000 })
  })

  it('xarajatlar turkum boʻyicha', async () => {
    const rows = (await report('2026-03')).data.topExpenses
    expect(rows[0]).toEqual({ category: 'materials', count: 1, total: 200_000 })
    expect(rows[1]).toEqual({ category: 'rent', count: 1, total: 100_000 })
  })

  it('boʻsh oyda roʻyxatlar boʻsh', async () => {
    const data = (await report('2026-01')).data
    expect(data.topTreatments).toEqual([])
    expect(data.topExpenses).toEqual([])
    expect(data.summary.profit).toBe(0)
  })

  it('notoʻgʻri oy rad etiladi', async () => {
    expect((await call('GET', '/api/reports?month=2026-13')).statusCode).toBe(400)
  })
})

describe('koʻp ijarachilik', () => {
  it('begona klinikaning pul harakati hisobotga tushmaydi', async () => {
    const otherPatient = await h.ownerDb.patient.create({
      data: { clinicId: otherClinicId, fio: 'Begona Bemor', fioSearch: 'begona bemor' },
    })
    await h.ownerDb.visit.create({
      data: {
        clinicId: otherClinicId,
        patientId: otherPatient.id,
        date: new Date('2026-03-10T00:00:00Z'),
        treatment: 'Begona muolaja',
        price: 7_000_000,
      },
    })
    await h.ownerDb.expense.create({
      data: {
        clinicId: otherClinicId,
        date: new Date('2026-03-10T00:00:00Z'),
        category: 'rent',
        description: 'Begona ijara',
        amount: 7_000_000,
      },
    })

    const data = (await report('2026-03')).data
    expect(data.summary.charges).toBe(550_000)
    expect(data.summary.expenses).toBe(300_000)
    expect(data.topTreatments.map((r: { treatment: string }) => r.treatment)).not.toContain(
      'Begona muolaja',
    )
  })
})

describe('rejalar konversiyasi', () => {
  /// Rejalar tuzilgan sana boʻyicha sanaladi — shuning uchun joriy oy
  async function plan(status?: 'accepted' | 'declined') {
    const created = await call('POST', '/api/plans', { patientId, title: 'Reja' })
    const id = created.json().data.id as string
    await h.app.inject({
      method: 'PUT',
      url: `/api/plans/${id}/content`,
      headers: { cookie: h.cookie },
      payload: { stages: [{ name: 'Bosqich', items: [{ treatment: 'Ish', price: 500_000 }] }] },
    })
    if (status) {
      await call('POST', `/api/plans/${id}/status`, { status: 'sent' })
      await call('POST', `/api/plans/${id}/status`, {
        status,
        ...(status === 'declined' ? { reason: 'Qimmat' } : {}),
      })
    }
    return id
  }

  it('tuzilgan, qabul qilingan va rad etilgan rejalar sanaladi', async () => {
    await plan('accepted')
    await plan('declined')
    await plan()

    const month = new Date().toISOString().slice(0, 7)
    const data = (await call('GET', `/api/reports?month=${month}`)).json().data

    expect(data.plans).toMatchObject({
      created: 3,
      accepted: 1,
      declined: 1,
      // Qabul qilinganining toʻlash summasi
      acceptedTotal: 500_000,
    })
    // Shifokorlar kesimida ham — bu yerda hammasi egasi nomidan
    expect(data.plans.byDoctor).toHaveLength(1)
    expect(data.plans.byDoctor[0]).toMatchObject({ created: 3, accepted: 1 })
  })

  it('boshqa oyda rejalar koʻrinmaydi', async () => {
    const data = (await call('GET', '/api/reports?month=2026-03')).json().data
    expect(data.plans).toMatchObject({ created: 0, accepted: 0, acceptedTotal: 0 })
    expect(data.plans.byDoctor).toEqual([])
  })
})

describe('ruxsat', () => {
  it('qabulxona hisobotni koʻra olmaydi', async () => {
    const reception = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'qabulxona' },
    })
    const owner = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, isOwner: true },
    })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: reception?.id } })
    expect((await call('GET', '/api/reports?month=2026-03')).statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })

  it('kuzatuvchi koʻra oladi — hisobot uning ishi', async () => {
    const watcher = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'kuzatuvchi' },
    })
    const owner = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, isOwner: true },
    })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: watcher?.id } })
    expect((await call('GET', '/api/reports?month=2026-03')).statusCode).toBe(200)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })
})
