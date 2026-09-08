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
let otherPatientId = ''

function call(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) {
  return h.app.inject({ method, url, payload, headers: { cookie: h.cookie } })
}

beforeAll(async () => {
  h = await startHarness()

  const created = await call('POST', '/api/patients', { fio: 'Toʻlovchi Bemor' })
  patientId = created.json().data.id
  // 500 000 soʻmlik tashrif
  await call('POST', '/api/visits', {
    patientId,
    date: '2026-09-01',
    treatment: 'Protez',
    price: 500_000,
  })

  const other = await createOtherClinic(h.ownerDb, 'B klinikasi')
  otherClinicId = other.id
  const otherPatient = await h.ownerDb.patient.create({
    data: { clinicId: otherClinicId, fio: 'Begona Bemor', fioSearch: 'begona bemor' },
  })
  otherPatientId = otherPatient.id
}, 30_000)

afterAll(async () => {
  await removeClinic(h.ownerDb, otherClinicId)
  await h.stop()
})

describe('toʻlov qabul qilish', () => {
  it('yoziladi', async () => {
    const r = await call('POST', '/api/payments', {
      patientId,
      date: '2026-09-02',
      amount: 200_000,
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.amount).toBe(200_000)
  })

  it('nol yoki manfiy summa rad etiladi', async () => {
    for (const amount of [0, -1000]) {
      const r = await call('POST', '/api/payments', { patientId, date: '2026-09-02', amount })
      expect(r.statusCode).toBe(400)
      expect(r.json().error.fields.amount).toBe('Summa noldan katta boʻlishi kerak')
    }
  })

  it('kelajakdagi sana rad etiladi', async () => {
    const r = await call('POST', '/api/payments', {
      patientId,
      date: '2099-01-01',
      amount: 1000,
    })
    expect(r.json().error.fields.date).toBe('Sana kelajakda boʻlishi mumkin emas')
  })
})

describe('hisob', () => {
  it('qarz = tashriflar − toʻlovlar', async () => {
    const r = await call('GET', `/api/patients/${patientId}/balance`)
    expect(r.json().data).toEqual({ charges: 500_000, paid: 200_000, debt: 300_000 })
  })

  it('ortiqcha toʻlansa qarz manfiy — oldindan toʻlangan', async () => {
    const created = await call('POST', '/api/payments', {
      patientId,
      date: '2026-09-03',
      amount: 400_000,
    })
    const balance = await call('GET', `/api/patients/${patientId}/balance`)
    expect(balance.json().data.debt).toBe(-100_000)

    // Keyingi testlar uchun qaytarib olamiz
    await call('DELETE', `/api/payments/${created.json().data.id}`)
  })

  it('toʻlov oʻchirilsa qarz qayta hisoblanadi', async () => {
    const r = await call('GET', `/api/patients/${patientId}/balance`)
    expect(r.json().data.debt).toBe(300_000)
  })
})

describe('qarzdorlar', () => {
  it('faqat qarzi borlar, qarzi boʻyicha kamayish tartibida', async () => {
    // Qarzi katta ikkinchi bemor
    const rich = await call('POST', '/api/patients', { fio: 'Katta Qarzdor' })
    const richId = rich.json().data.id
    await call('POST', '/api/visits', {
      patientId: richId,
      date: '2026-09-01',
      treatment: 'Implant',
      price: 900_000,
    })
    // Qarzi yoʻq uchinchi bemor
    const clean = await call('POST', '/api/patients', { fio: 'Qarzsiz Bemor' })
    const cleanId = clean.json().data.id
    await call('POST', '/api/visits', {
      patientId: cleanId,
      date: '2026-09-01',
      treatment: 'Koʻrik',
      price: 50_000,
    })
    await call('POST', '/api/payments', { patientId: cleanId, date: '2026-09-01', amount: 50_000 })

    const r = await call('GET', '/api/debtors')
    const data = r.json().data
    const names = data.items.map((row: { fio: string }) => row.fio)

    expect(names).toEqual(['Katta Qarzdor', 'Toʻlovchi Bemor'])
    expect(names).not.toContain('Qarzsiz Bemor')
    expect(data.items[0].debt).toBe(900_000)
    expect(data.totalDebt).toBe(1_200_000)
    expect(data.total).toBe(2)
  })

  it('bemor nomi va telefoni ham qaytadi', async () => {
    const r = await call('GET', '/api/debtors')
    const row = r.json().data.items.find((x: { fio: string }) => x.fio === 'Toʻlovchi Bemor')
    expect(row).toMatchObject({ charges: 500_000, paid: 200_000, debt: 300_000 })
    expect(row).toHaveProperty('phone')
  })
})

describe('koʻp ijarachilik', () => {
  it('begona bemorga toʻlov yozib boʻlmaydi', async () => {
    const r = await call('POST', '/api/payments', {
      patientId: otherPatientId,
      date: '2026-09-01',
      amount: 10_000,
    })
    expect(r.statusCode).toBe(404)
    expect(await h.ownerDb.payment.count({ where: { patientId: otherPatientId } })).toBe(0)
  })

  it('begona bemorning hisobini koʻrib boʻlmaydi', async () => {
    expect((await call('GET', `/api/patients/${otherPatientId}/balance`)).statusCode).toBe(404)
    expect((await call('GET', `/api/patients/${otherPatientId}/payments`)).statusCode).toBe(404)
  })

  it('qarzdorlar roʻyxatida begona klinika bemori yoʻq', async () => {
    await h.ownerDb.visit.create({
      data: {
        clinicId: otherClinicId,
        patientId: otherPatientId,
        date: new Date('2026-09-01'),
        treatment: 'Begona tashrif',
        price: 5_000_000,
      },
    })
    const r = await call('GET', '/api/debtors')
    const names = r.json().data.items.map((row: { fio: string }) => row.fio)
    expect(names).not.toContain('Begona Bemor')
    expect(r.json().data.totalDebt).toBe(1_200_000)
  })

  it('begona klinikaning toʻlovini oʻchirib boʻlmaydi', async () => {
    const foreign = await h.ownerDb.payment.create({
      data: {
        clinicId: otherClinicId,
        patientId: otherPatientId,
        date: new Date('2026-09-01'),
        amount: 1000,
      },
    })
    const r = await call('DELETE', `/api/payments/${foreign.id}`)
    expect(r.statusCode).toBe(404)
    expect(await h.ownerDb.payment.findUnique({ where: { id: foreign.id } })).not.toBeNull()
  })
})

describe('ruxsat', () => {
  it('payments.read yoʻq rolda koʻrib boʻlmaydi', async () => {
    const doctor = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'shifokor' },
    })
    const owner = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, isOwner: true },
    })

    // Shifokorga toʻlovlar ochilmagan (tz.md 1-boʻlim)
    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: doctor?.id } })
    expect((await call('GET', '/api/debtors')).statusCode).toBe(403)
    expect(
      (await call('POST', '/api/payments', { patientId, date: '2026-09-01', amount: 1000 }))
        .statusCode,
    ).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })
})
