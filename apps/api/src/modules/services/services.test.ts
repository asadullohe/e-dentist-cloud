import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

let h: Harness
let otherClinicId = ''

function call(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) {
  return h.app.inject({ method, url, payload, headers: { cookie: h.cookie } })
}

beforeAll(async () => {
  h = await startHarness()
  const other = await createOtherClinic(h.ownerDb, 'B klinikasi')
  otherClinicId = other.id
}, 30_000)

afterAll(async () => {
  await removeClinic(h.ownerDb, otherClinicId)
  await h.stop()
})

describe('narxnoma', () => {
  it('xizmat qoʻshiladi', async () => {
    const r = await call('POST', '/api/services', { name: 'Karies davolash', price: 250_000 })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({ name: 'Karies davolash', price: 250_000 })
  })

  it('nom klinika ichida takrorlanmaydi', async () => {
    const r = await call('POST', '/api/services', { name: 'Karies davolash', price: 300_000 })
    expect(r.statusCode).toBe(409)
    expect(r.json().error.message).toMatch(/allaqachon bor/)
  })

  it('manfiy narx rad etiladi', async () => {
    const r = await call('POST', '/api/services', { name: 'Notoʻgʻri', price: -1 })
    expect(r.json().error.fields.price).toBe('Narx manfiy boʻlishi mumkin emas')
  })

  it('nom boʻyicha tartiblangan roʻyxat', async () => {
    await call('POST', '/api/services', { name: 'Aseptika', price: 20_000 })
    await call('POST', '/api/services', { name: 'Zirkoniy koronka', price: 900_000 })

    const r = await call('GET', '/api/services')
    const names = r.json().data.map((x: { name: string }) => x.name)
    expect(names).toEqual(['Aseptika', 'Karies davolash', 'Zirkoniy koronka'])
  })

  it('narx oʻzgartiriladi', async () => {
    const list = await call('GET', '/api/services')
    const item = list.json().data[0]
    const r = await call('PATCH', `/api/services/${item.id}`, { price: 25_000 })
    expect(r.json().data.price).toBe(25_000)
  })
})

// Tashrifda muolaja nomi ham, narxi ham matn/son sifatida saqlanadi —
// narxnoma keyin oʻzgarsa yoki oʻchirilsa tarix buzilmasin
describe('narxnoma va tashriflar tarixi', () => {
  it('xizmat oʻchirilsa tashrifdagi nom va narx qoladi', async () => {
    const patient = await call('POST', '/api/patients', { fio: 'Tarix Bemori' })
    const patientId = patient.json().data.id

    const created = await call('POST', '/api/services', { name: 'Vaqtinchalik', price: 111_000 })
    const serviceId = created.json().data.id

    await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-01',
      treatment: 'Vaqtinchalik',
      price: 111_000,
      serviceId,
    })

    expect((await call('DELETE', `/api/services/${serviceId}`)).statusCode).toBe(200)

    const visits = await call('GET', `/api/patients/${patientId}/visits`)
    const visit = visits.json().data[0]
    expect(visit.treatment).toBe('Vaqtinchalik')
    expect(visit.price).toBe(111_000)
    expect(visit.serviceId).toBeNull()
  })
})

describe('koʻp ijarachilik', () => {
  it('begona klinikaning narxnomasi koʻrinmaydi', async () => {
    await h.ownerDb.service.create({
      data: { clinicId: otherClinicId, name: 'Begona xizmat', price: 1000 },
    })
    const r = await call('GET', '/api/services')
    const names = r.json().data.map((x: { name: string }) => x.name)
    expect(names).not.toContain('Begona xizmat')
  })

  it('begona xizmatni oʻzgartirib boʻlmaydi', async () => {
    const foreign = await h.ownerDb.service.findFirst({ where: { clinicId: otherClinicId } })
    const r = await call('PATCH', `/api/services/${foreign?.id}`, { price: 1 })
    expect(r.statusCode).toBe(404)

    const untouched = await h.ownerDb.service.findUnique({ where: { id: foreign?.id } })
    expect(untouched?.price).toBe(1000)
  })

  it('bir xil nom turli klinikalarda boʻlishi mumkin', async () => {
    const r = await call('POST', '/api/services', { name: 'Begona xizmat', price: 5000 })
    expect(r.statusCode).toBe(200)
  })
})

describe('ruxsat', () => {
  it('shifokor narxnomani oʻqiydi, lekin oʻzgartira olmaydi', async () => {
    const doctor = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'shifokor' },
    })
    const owner = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, isOwner: true },
    })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: doctor?.id } })
    // Tashrif yozayotganda narxni tanlashi kerak
    expect((await call('GET', '/api/services')).statusCode).toBe(200)
    expect((await call('POST', '/api/services', { name: 'X', price: 1 })).statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })
})
