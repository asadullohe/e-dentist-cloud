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

let typeId = ''
let otherTypeId = ''

describe('xizmat turlari', () => {
  it('tur qoʻshiladi, oxiriga tushadi; nom klinika ichida takrorlanmaydi', async () => {
    const a = await call('POST', '/api/service-types', { name: 'Terapiya' })
    expect(a.statusCode).toBe(200)
    typeId = a.json().data.id
    const b = await call('POST', '/api/service-types', { name: 'Jarrohlik' })
    otherTypeId = b.json().data.id
    expect(b.json().data.position).toBeGreaterThan(a.json().data.position)

    const dup = await call('POST', '/api/service-types', { name: 'Terapiya' })
    expect(dup.statusCode).toBe(409)
    expect(dup.json().error.message).toMatch(/allaqachon bor/)
  })

  it('roʻyxat tartib boʻyicha, har turda xizmatlar soni', async () => {
    const r = await call('GET', '/api/service-types')
    const rows = r.json().data as { name: string; serviceCount: number }[]
    expect(rows.map((x) => x.name)).toEqual(['Terapiya', 'Jarrohlik'])
    expect(rows[0]?.serviceCount).toBe(0)
  })

  it('tartib oʻzgartiriladi; toʻliq boʻlmagan roʻyxat — 400', async () => {
    const bad = await call('PATCH', '/api/service-types/order', { ids: [typeId] })
    expect(bad.statusCode).toBe(400)

    const r = await call('PATCH', '/api/service-types/order', { ids: [otherTypeId, typeId] })
    expect(r.statusCode).toBe(200)
    const names = (await call('GET', '/api/service-types'))
      .json()
      .data.map((x: { name: string }) => x.name)
    expect(names).toEqual(['Jarrohlik', 'Terapiya'])
  })
})

describe('xizmatlar', () => {
  it('xizmat turga qoʻshiladi; tursiz — 400', async () => {
    const r = await call('POST', '/api/services', {
      typeId,
      name: 'Karies davolash',
      price: 250_000,
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({
      typeId,
      typeName: 'Terapiya',
      name: 'Karies davolash',
      price: 250_000,
    })

    const noType = await call('POST', '/api/services', { name: 'Tursiz', price: 1 })
    expect(noType.statusCode).toBe(400)
    expect(noType.json().error.fields.typeId).toBe('Xizmat turini tanlang')
  })

  it('nom tur ichida takrorlanmaydi, boshqa turda mumkin', async () => {
    const dup = await call('POST', '/api/services', { typeId, name: 'Karies davolash', price: 1 })
    expect(dup.statusCode).toBe(409)
    const other = await call('POST', '/api/services', {
      typeId: otherTypeId,
      name: 'Karies davolash',
      price: 1,
    })
    expect(other.statusCode).toBe(200)
    await call('DELETE', `/api/services/${other.json().data.id}`)
  })

  it('texnik narxi: berilsa saqlanadi, null — olib tashlanadi', async () => {
    const r = await call('POST', '/api/services', {
      typeId,
      name: 'Sirkoniy koronka',
      price: 1_500_000,
      techPrice: 400_000,
    })
    expect(r.json().data).toMatchObject({ techPrice: 400_000 })
    const id = r.json().data.id
    const off = await call('PATCH', `/api/services/${id}`, { techPrice: null })
    expect(off.json().data.techPrice).toBeNull()
    const neg = await call('PATCH', `/api/services/${id}`, { techPrice: -5 })
    expect(neg.statusCode).toBe(400)
    await call('DELETE', `/api/services/${id}`)
  })

  it('manfiy narx rad etiladi', async () => {
    const r = await call('POST', '/api/services', { typeId, name: 'Notoʻgʻri', price: -1 })
    expect(r.json().error.fields.price).toBe('Narx manfiy boʻlishi mumkin emas')
  })

  it('roʻyxat: tur tartibi, keyin tur ichidagi tartib', async () => {
    await call('POST', '/api/services', { typeId, name: 'Aseptika', price: 20_000 })
    await call('POST', '/api/services', { typeId: otherTypeId, name: 'Tish olish', price: 150_000 })

    const r = await call('GET', '/api/services')
    const names = r.json().data.map((x: { name: string }) => x.name)
    // Jarrohlik birinchi (tartib), ichida Tish olish; Terapiyada qoʻshilish tartibida
    expect(names).toEqual(['Tish olish', 'Karies davolash', 'Aseptika'])
  })

  it('tur ichida tartib oʻzgartiriladi', async () => {
    const list = (await call('GET', '/api/services')).json().data as {
      id: string
      typeId: string
    }[]
    const ids = list.filter((x) => x.typeId === typeId).map((x) => x.id)
    const r = await call('PATCH', `/api/service-types/${typeId}/order`, { ids: [...ids].reverse() })
    expect(r.statusCode).toBe(200)
    const names = (await call('GET', '/api/services'))
      .json()
      .data.filter((x: { typeId: string }) => x.typeId === typeId)
      .map((x: { name: string }) => x.name)
    expect(names).toEqual(['Aseptika', 'Karies davolash'])
  })

  it('narx oʻzgartiriladi; boshqa turga koʻchiriladi', async () => {
    const list = await call('GET', '/api/services')
    const item = list.json().data.find((x: { name: string }) => x.name === 'Aseptika')
    const r = await call('PATCH', `/api/services/${item.id}`, {
      price: 25_000,
      typeId: otherTypeId,
    })
    expect(r.json().data).toMatchObject({ price: 25_000, typeName: 'Jarrohlik' })
    await call('PATCH', `/api/services/${item.id}`, { typeId })
  })

  it('ichida xizmati bor tur oʻchirilmaydi — 409; boʻshi oʻchadi', async () => {
    const busy = await call('DELETE', `/api/service-types/${typeId}`)
    expect(busy.statusCode).toBe(409)
    expect(busy.json().error.message).toContain('2 ta xizmat')

    const empty = await call('POST', '/api/service-types', { name: 'Vaqtinchalik tur' })
    expect((await call('DELETE', `/api/service-types/${empty.json().data.id}`)).statusCode).toBe(
      200,
    )
  })
})

// Xizmatning qoʻllanish sohasi (tz.md 19-boʻlim): tashrif va reja bandi
// shunga qarab tish soʻraydi
describe('qoʻllanish sohasi', () => {
  it('sukut — bitta tish; soha saqlanadi va tahrirlanadi', async () => {
    const created = await call('POST', '/api/services', { typeId, name: 'Sohasiz', price: 10_000 })
    expect(created.json().data.area).toBe('tooth')

    const mouth = await call('POST', '/api/services', {
      typeId,
      name: 'Professional tozalash',
      price: 300_000,
      area: 'mouth',
    })
    expect(mouth.json().data.area).toBe('mouth')

    const moved = await call('PATCH', `/api/services/${created.json().data.id}`, { area: 'arch' })
    expect(moved.json().data.area).toBe('arch')

    const bad = await call('POST', '/api/services', {
      typeId,
      name: 'Notoʻgʻri soha',
      price: 1000,
      area: 'surface',
    })
    expect(bad.statusCode).toBe(400)
  })

  it('tashrif: tish soʻramaydigan xizmatda tish boʻsh yoziladi', async () => {
    const patient = await call('POST', '/api/patients', { fio: 'Soha Bemori' })
    const patientId = patient.json().data.id
    const service = await call('POST', '/api/services', {
      typeId,
      name: 'Oqartirish',
      price: 1_200_000,
      area: 'mouth',
    })

    // Tish yuborilsa ham — soha butun ogʻiz, yozuvda qolmaydi
    const visit = await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-02',
      treatment: 'Oqartirish',
      price: 1_200_000,
      serviceId: service.json().data.id,
      tooth: 21,
    })
    expect(visit.statusCode).toBe(200)
    expect(visit.json().data.tooth).toBeNull()
  })

  it('tashrif: bitta tish xizmatida tishsiz yozilmaydi — yozishda ham, tahrirda ham', async () => {
    const patient = await call('POST', '/api/patients', { fio: 'Tishsiz Bemori' })
    const patientId = patient.json().data.id
    const service = await call('POST', '/api/services', {
      typeId,
      name: 'Sirkoniy koronka',
      price: 1_800_000,
      area: 'tooth',
    })
    const serviceId = service.json().data.id

    const bad = await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-03',
      treatment: 'Sirkoniy koronka',
      price: 1_800_000,
      serviceId,
    })
    expect(bad.statusCode).toBe(400)
    expect(bad.json().error.fields.tooth).toMatch(/tish/i)

    const ok = await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-03',
      treatment: 'Sirkoniy koronka',
      price: 1_800_000,
      serviceId,
      tooth: 26,
    })
    expect(ok.statusCode).toBe(200)

    // Tahrirda tishni olib tashlab boʻlmaydi — xizmat oʻsha-oʻsha
    const cleared = await call('PATCH', `/api/visits/${ok.json().data.id}`, { tooth: null })
    expect(cleared.statusCode).toBe(400)
  })
})

// Tashrifda muolaja nomi ham, narxi ham matn/son sifatida saqlanadi —
// xizmat keyin oʻzgarsa yoki oʻchirilsa tarix buzilmasin
describe('xizmatlar va tashriflar tarixi', () => {
  it('xizmat oʻchirilsa tashrifdagi nom va narx qoladi', async () => {
    const patient = await call('POST', '/api/patients', { fio: 'Tarix Bemori' })
    const patientId = patient.json().data.id

    const created = await call('POST', '/api/services', {
      typeId,
      name: 'Vaqtinchalik',
      price: 111_000,
    })
    const serviceId = created.json().data.id

    await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-01',
      treatment: 'Vaqtinchalik',
      price: 111_000,
      serviceId,
      // Sukut soha `tooth` — tish koʻrsatilishi shart (19-boʻlim)
      tooth: 16,
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
  let foreignTypeId = ''
  let foreignServiceId = ''

  it('begona klinikaning turlari va xizmatlari koʻrinmaydi', async () => {
    const type = await h.ownerDb.serviceType.create({
      data: { clinicId: otherClinicId, name: 'Begona tur' },
    })
    foreignTypeId = type.id
    const svc = await h.ownerDb.service.create({
      data: { clinicId: otherClinicId, typeId: type.id, name: 'Begona xizmat', price: 1000 },
    })
    foreignServiceId = svc.id

    const types = (await call('GET', '/api/service-types'))
      .json()
      .data.map((x: { name: string }) => x.name)
    expect(types).not.toContain('Begona tur')
    const names = (await call('GET', '/api/services'))
      .json()
      .data.map((x: { name: string }) => x.name)
    expect(names).not.toContain('Begona xizmat')
  })

  it('begona xizmat va turni oʻzgartirib boʻlmaydi; begona turga xizmat yozilmaydi', async () => {
    expect(
      (await call('PATCH', `/api/services/${foreignServiceId}`, { price: 1 })).statusCode,
    ).toBe(404)
    expect(
      (await call('PATCH', `/api/service-types/${foreignTypeId}`, { name: 'Boshqa' })).statusCode,
    ).toBe(404)
    expect((await call('DELETE', `/api/service-types/${foreignTypeId}`)).statusCode).toBe(404)

    const r = await call('POST', '/api/services', {
      typeId: foreignTypeId,
      name: 'Suqilma',
      price: 1,
    })
    expect(r.statusCode).toBe(400)

    const untouched = await h.ownerDb.service.findUnique({ where: { id: foreignServiceId } })
    expect(untouched?.price).toBe(1000)
  })

  it('bir xil nom turli klinikalarda boʻlishi mumkin', async () => {
    const r = await call('POST', '/api/services', { typeId, name: 'Begona xizmat', price: 5000 })
    expect(r.statusCode).toBe(200)
  })
})

describe('ruxsat', () => {
  it('shifokor xizmatlarni oʻqiydi, lekin oʻzgartira olmaydi', async () => {
    const doctor = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'shifokor' },
    })
    const owner = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, isOwner: true },
    })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: doctor?.id } })
    // Tashrif yozayotganda narxni tanlashi kerak
    expect((await call('GET', '/api/services')).statusCode).toBe(200)
    expect((await call('GET', '/api/service-types')).statusCode).toBe(200)
    expect((await call('POST', '/api/services', { typeId, name: 'X', price: 1 })).statusCode).toBe(
      403,
    )
    expect((await call('POST', '/api/service-types', { name: 'X' })).statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })
})
