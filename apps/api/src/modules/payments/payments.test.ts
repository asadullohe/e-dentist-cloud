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
    // Kim qabul qilgani yoziladi
    expect(r.json().data.createdByName).toBeTruthy()
    expect(r.json().data.cancelledAt).toBeNull()
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

    // Keyingi testlar uchun bekor qilamiz — oʻchirish yoʻq
    await call('POST', `/api/payments/${created.json().data.id}/cancel`, {
      reason: 'Sinov — ortiqcha toʻlov',
    })
  })

  it('toʻlov bekor qilinsa qarz qayta hisoblanadi', async () => {
    const r = await call('GET', `/api/patients/${patientId}/balance`)
    expect(r.json().data.debt).toBe(300_000)
  })
})

// Toʻlov oʻchirilmaydi — bekor qilinadi, sabab bilan (qaror 19/09/2026)
describe('bekor qilish', () => {
  it('bekor qilingan toʻlov roʻyxatda qoladi: sabab, kim, qachon', async () => {
    const created = await call('POST', '/api/payments', {
      patientId,
      date: '2026-09-04',
      amount: 50_000,
    })
    const id = created.json().data.id
    const r = await call('POST', `/api/payments/${id}/cancel`, { reason: 'Summa notoʻgʻri' })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.cancelReason).toBe('Summa notoʻgʻri')
    expect(r.json().data.cancelledAt).toBeTruthy()
    expect(r.json().data.cancelledByName).toBeTruthy()

    const list = await call('GET', `/api/patients/${patientId}/payments`)
    const row = list.json().data.find((p: { id: string }) => p.id === id)
    expect(row.cancelledAt).toBeTruthy()
    // Hisobga kirmaydi
    const balance = await call('GET', `/api/patients/${patientId}/balance`)
    expect(balance.json().data.debt).toBe(300_000)
  })

  it('sababsiz bekor qilib boʻlmaydi', async () => {
    const created = await call('POST', '/api/payments', {
      patientId,
      date: '2026-09-04',
      amount: 10_000,
    })
    const id = created.json().data.id
    const r = await call('POST', `/api/payments/${id}/cancel`, { reason: '' })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.reason).toBe('Bekor qilish sababini yozing')
    await call('POST', `/api/payments/${id}/cancel`, { reason: 'Sinov' })
  })

  it('ikki marta bekor qilib boʻlmaydi; bekor qilinganini tahrirlab boʻlmaydi', async () => {
    const created = await call('POST', '/api/payments', {
      patientId,
      date: '2026-09-04',
      amount: 10_000,
    })
    const id = created.json().data.id
    await call('POST', `/api/payments/${id}/cancel`, { reason: 'Sinov' })
    expect((await call('POST', `/api/payments/${id}/cancel`, { reason: 'Yana' })).statusCode).toBe(
      409,
    )
    expect((await call('PATCH', `/api/payments/${id}`, { note: 'x' })).statusCode).toBe(409)
  })

  it('summa va sana tahrirlanmaydi — faqat izoh', async () => {
    const created = await call('POST', '/api/payments', {
      patientId,
      date: '2026-09-04',
      amount: 10_000,
    })
    const id = created.json().data.id
    const r = await call('PATCH', `/api/payments/${id}`, {
      amount: 999_999,
      date: '2026-01-01',
      note: 'Naqd',
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.amount).toBe(10_000)
    expect(r.json().data.date.slice(0, 10)).toBe('2026-09-04')
    expect(r.json().data.note).toBe('Naqd')
    await call('POST', `/api/payments/${id}/cancel`, { reason: 'Sinov' })
  })

  it('DELETE yoʻq', async () => {
    const r = await call('DELETE', '/api/payments/00000000-0000-7000-8000-000000000000')
    expect(r.statusCode).toBe(404)
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

  it('ism boʻyicha filtr sahifalashdan oldin ishlaydi', async () => {
    const r = await call('GET', '/api/debtors?q=tolovchi')
    const data = r.json().data
    expect(data.items.map((x: { fio: string }) => x.fio)).toEqual(['Toʻlovchi Bemor'])
    expect(data.total).toBe(1)
    // Jami qarz ham filtrlangan roʻyxat boʻyicha
    expect(data.totalDebt).toBe(300_000)
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

  it('begona klinikaning toʻlovini bekor qilib boʻlmaydi', async () => {
    const foreign = await h.ownerDb.payment.create({
      data: {
        clinicId: otherClinicId,
        patientId: otherPatientId,
        date: new Date('2026-09-01'),
        amount: 1000,
      },
    })
    const r = await call('POST', `/api/payments/${foreign.id}/cancel`, { reason: 'Sinov' })
    expect(r.statusCode).toBe(404)
    const row = await h.ownerDb.payment.findUnique({ where: { id: foreign.id } })
    expect(row?.cancelledAt).toBeNull()
  })
})

describe('ruxsat', () => {
  it('payments.read yoʻq rolda koʻrib boʻlmaydi', async () => {
    // Texnik: toʻlovlarga aloqasi yoʻq (tz.md 7-boʻlim). Shifokorga esa
    // toʻlov qabul qilish ochiq (qaror 19/09/2026)
    const tech = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'texnik' },
    })
    const owner = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, isOwner: true },
    })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: tech?.id } })
    expect((await call('GET', '/api/debtors')).statusCode).toBe(403)
    expect(
      (await call('POST', '/api/payments', { patientId, date: '2026-09-01', amount: 1000 }))
        .statusCode,
    ).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })

  it('shifokor toʻlov qabul qiladi', async () => {
    const doctor = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'shifokor' },
    })
    const owner = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, isOwner: true },
    })
    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: doctor?.id } })
    const r = await call('POST', '/api/payments', { patientId, date: '2026-09-01', amount: 1000 })
    expect(r.statusCode).toBe(200)
    await call('POST', `/api/payments/${r.json().data.id}/cancel`, { reason: 'Sinov' })
    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })
})
