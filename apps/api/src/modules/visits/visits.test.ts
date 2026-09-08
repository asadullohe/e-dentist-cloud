import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Harness, removeClinic, startHarness } from '../../test-support/harness.js'

let h: Harness
let patientId = ''
/// B klinikasi va uning bemori — koʻp ijarachilik tekshiruvi uchun
let otherClinicId = ''
let otherPatientId = ''

async function call(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  url: string,
  payload?: object,
) {
  return await h.app.inject({ method, url, payload, headers: { cookie: h.cookie } })
}

beforeAll(async () => {
  h = await startHarness()

  const created = await call('POST', '/api/patients', { fio: 'Karimov Aziz' })
  patientId = created.json().data.id

  const other = await h.ownerDb.clinic.create({
    data: { name: 'B klinikasi', expiresAt: new Date('2030-01-01') },
  })
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

describe('tashrif yozish', () => {
  it('yoziladi va qaytariladi', async () => {
    const r = await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-01',
      treatment: 'Karies davolash',
      tooth: 16,
      price: 250_000,
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({ treatment: 'Karies davolash', tooth: 16, price: 250_000 })
  })

  it('kelajakdagi sana rad etiladi — u tashrif emas, qabul', async () => {
    const r = await call('POST', '/api/visits', {
      patientId,
      date: '2099-01-01',
      treatment: 'Koʻrik',
    })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.date).toBe('Sana kelajakda boʻlishi mumkin emas')
  })

  it('mavjud boʻlmagan tish raqami rad etiladi', async () => {
    const r = await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-01',
      treatment: 'Koʻrik',
      tooth: 19,
    })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.tooth).toBe('Bunday tish raqami yoʻq')
  })

  it('manfiy narx rad etiladi', async () => {
    const r = await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-01',
      treatment: 'Koʻrik',
      price: -5,
    })
    expect(r.json().error.fields.price).toBe('Narx manfiy boʻlishi mumkin emas')
  })
})

describe('tashriflar roʻyxati', () => {
  it('yangisi tepada', async () => {
    await call('POST', '/api/visits', { patientId, date: '2026-08-01', treatment: 'Eski' })
    await call('POST', '/api/visits', { patientId, date: '2026-09-05', treatment: 'Yangi' })

    const r = await call('GET', `/api/patients/${patientId}/visits`)
    const treatments = r.json().data.map((v: { treatment: string }) => v.treatment)
    expect(treatments[0]).toBe('Yangi')
    expect(treatments.at(-1)).toBe('Eski')
  })
})

describe('tish xaritasi', () => {
  it('holat belgilanadi va butun xarita qaytadi', async () => {
    const r = await call('PUT', `/api/patients/${patientId}/teeth/16`, {
      status: 'koronka',
      material: 'sirkoniy',
    })
    expect(r.statusCode).toBe(200)

    const chart = r.json().data
    expect(chart.teeth).toContainEqual({
      tooth: 16,
      status: 'koronka',
      material: 'sirkoniy',
      note: null,
    })
    expect(chart.bridges).toEqual([])
  })

  it('takror yozilsa yangilanadi, ikkinchi qator paydo boʻlmaydi', async () => {
    await call('PUT', `/api/patients/${patientId}/teeth/16`, { status: 'karies' })
    const r = await call('GET', `/api/patients/${patientId}/teeth`)
    const sixteen = r.json().data.teeth.filter((t: { tooth: number }) => t.tooth === 16)
    expect(sixteen).toHaveLength(1)
    expect(sixteen[0].status).toBe('karies')
  })

  // «Sogʻlom» — sukut holati, uni saqlab oʻtirishning maʼnosi yoʻq
  it('sogʻlom holat izohsiz boʻlsa qator oʻchiriladi', async () => {
    await call('PUT', `/api/patients/${patientId}/teeth/16`, { status: 'soglom' })
    const r = await call('GET', `/api/patients/${patientId}/teeth`)
    expect(r.json().data.teeth.some((t: { tooth: number }) => t.tooth === 16)).toBe(false)
  })

  it('sogʻlom boʻlsa ham izoh boʻlsa saqlanadi', async () => {
    await call('PUT', `/api/patients/${patientId}/teeth/17`, {
      status: 'soglom',
      note: 'Kuzatuvda',
    })
    const r = await call('GET', `/api/patients/${patientId}/teeth`)
    expect(r.json().data.teeth.find((t: { tooth: number }) => t.tooth === 17)?.note).toBe(
      'Kuzatuvda',
    )
  })

  it('notoʻgʻri holat rad etiladi', async () => {
    const r = await call('PUT', `/api/patients/${patientId}/teeth/21`, { status: 'yangi-holat' })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.status).toBe('Bunday tish holati yoʻq')
  })
})

// Tashqi kalit tekshiruvi RLS ni chetlab oʻtadi — usiz begona klinikaning
// bemoriga yozuv bogʻlab qoʻyish mumkin boʻlardi
describe('koʻp ijarachilik', () => {
  it('begona bemorga tashrif yozib boʻlmaydi', async () => {
    const r = await call('POST', '/api/visits', {
      patientId: otherPatientId,
      date: '2026-09-01',
      treatment: 'Buzgʻunchilik',
    })
    expect(r.statusCode).toBe(404)
    expect(await h.ownerDb.visit.count({ where: { patientId: otherPatientId } })).toBe(0)
  })

  it('begona bemorning tashriflarini koʻrib boʻlmaydi', async () => {
    const r = await call('GET', `/api/patients/${otherPatientId}/visits`)
    expect(r.statusCode).toBe(404)
  })

  it('begona bemorning tish xaritasini koʻrib boʻlmaydi', async () => {
    const r = await call('GET', `/api/patients/${otherPatientId}/teeth`)
    expect(r.statusCode).toBe(404)
  })

  it('begona bemorning tishini oʻzgartirib boʻlmaydi', async () => {
    const r = await call('PUT', `/api/patients/${otherPatientId}/teeth/16`, { status: 'karies' })
    expect(r.statusCode).toBe(404)
    expect(await h.ownerDb.tooth.count({ where: { patientId: otherPatientId } })).toBe(0)
  })

  it('begona klinikaning tashrifini oʻchirib boʻlmaydi', async () => {
    const foreign = await h.ownerDb.visit.create({
      data: {
        clinicId: otherClinicId,
        patientId: otherPatientId,
        date: new Date('2026-09-01'),
        treatment: 'Begona tashrif',
        price: 0,
      },
    })
    const r = await call('DELETE', `/api/visits/${foreign.id}`)
    expect(r.statusCode).toBe(404)
    expect(await h.ownerDb.visit.findUnique({ where: { id: foreign.id } })).not.toBeNull()
  })
})

describe('ruxsat', () => {
  it('visits.write yoʻq rolda tashrif yozib boʻlmaydi', async () => {
    const reception = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'qabulxona' },
    })
    const owner = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, isOwner: true },
    })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: reception?.id } })
    // Qabulxona bemorni koʻradi, lekin muolaja yozmaydi
    expect((await call('GET', `/api/patients/${patientId}/visits`)).statusCode).toBe(200)
    expect(
      (await call('POST', '/api/visits', { patientId, date: '2026-09-01', treatment: 'X' }))
        .statusCode,
    ).toBe(403)
    expect(
      (await call('PUT', `/api/patients/${patientId}/teeth/11`, { status: 'karies' })).statusCode,
    ).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })
})

describe('koʻprik', () => {
  it('turli jagʻdagi tishlar rad etiladi', async () => {
    const r = await call('POST', `/api/patients/${patientId}/bridges`, { from: 14, to: 44 })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.message).toBe('Ikkala tish ham bitta jagʻda boʻlishi kerak')
  })

  // Tishi yoʻq joyga quyma tish, qolganiga tayanch koronka
  it('sukut rollar tishning holatiga qarab tanlanadi', async () => {
    await call('PUT', `/api/patients/${patientId}/teeth/45`, { status: 'olingan' })

    const r = await call('POST', `/api/patients/${patientId}/bridges`, {
      from: 46,
      to: 44,
      material: 'metall-keramika',
    })
    expect(r.statusCode).toBe(200)

    const byTooth = new Map(
      r.json().data.teeth.map((t: { tooth: number; status: string }) => [t.tooth, t.status]),
    )
    expect(byTooth.get(45)).toBe('koprik')
    expect(byTooth.get(46)).toBe('koronka')
    expect(byTooth.get(44)).toBe('koronka')
    expect(r.json().data.bridges[0].teeth).toEqual([46, 45, 44])
  })

  it('rol qoʻlda berilsa oʻsha ishlatiladi', async () => {
    const r = await call('POST', `/api/patients/${patientId}/bridges`, {
      from: 24,
      to: 26,
      roles: { '25': 'koprik' },
    })
    const byTooth = new Map(
      r.json().data.teeth.map((t: { tooth: number; status: string }) => [t.tooth, t.status]),
    )
    expect(byTooth.get(25)).toBe('koprik')
    expect(byTooth.get(24)).toBe('koronka')
  })

  it('oʻchirilganda tishlar holati qaytariladi', async () => {
    const chart = await call('GET', `/api/patients/${patientId}/teeth`)
    const bridge = chart.json().data.bridges.find((b: { teeth: number[] }) => b.teeth.includes(45))

    const r = await call('DELETE', `/api/bridges/${bridge.id}`)
    expect(r.statusCode).toBe(200)

    const byTooth = new Map(
      r.json().data.teeth.map((t: { tooth: number; status: string }) => [t.tooth, t.status]),
    )
    // Quyma tish oʻrnida tish yoʻq edi
    expect(byTooth.get(45)).toBe('olingan')
    // Tayanch tishlar sogʻlomga qaytadi — sukut holat, qator saqlanmaydi
    expect(byTooth.has(46)).toBe(false)
    expect(byTooth.has(44)).toBe(false)
    expect(r.json().data.bridges.some((b: { id: string }) => b.id === bridge.id)).toBe(false)
  })

  it('begona klinikaning bemoriga koʻprik qoʻyib boʻlmaydi', async () => {
    const r = await call('POST', `/api/patients/${otherPatientId}/bridges`, { from: 14, to: 16 })
    expect(r.statusCode).toBe(404)
    expect(await h.ownerDb.bridge.count({ where: { patientId: otherPatientId } })).toBe(0)
  })

  it('begona klinikaning koʻprigini oʻchirib boʻlmaydi', async () => {
    const foreign = await h.ownerDb.bridge.create({
      data: {
        clinicId: otherClinicId,
        patientId: otherPatientId,
        teeth: [14, 15, 16],
        material: 'sirkoniy',
      },
    })
    const r = await call('DELETE', `/api/bridges/${foreign.id}`)
    expect(r.statusCode).toBe(404)
    expect(await h.ownerDb.bridge.findUnique({ where: { id: foreign.id } })).not.toBeNull()
  })
})
