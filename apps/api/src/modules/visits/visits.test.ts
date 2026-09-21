import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

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

  // Vaqt: berilsa saqlanadi, berilmasa hozirgi soat (12-bosqich)
  it('vaqt saqlanadi; berilmasa hozirgi vaqt; notoʻgʻrisi 400', async () => {
    const withTime = await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-01',
      time: '14:30',
      treatment: 'Vaqtli tashrif',
    })
    expect(withTime.statusCode).toBe(200)
    expect(withTime.json().data.time).toBe('14:30')

    const auto = await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-01',
      treatment: 'Vaqtsiz tashrif',
    })
    expect(auto.json().data.time).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/)

    for (const time of ['25:00', '9:5', '14.30', '']) {
      const bad = await call('POST', '/api/visits', {
        patientId,
        date: '2026-09-01',
        time,
        treatment: 'Notoʻgʻri vaqt',
      })
      expect(bad.statusCode, time).toBe(400)
    }

    // Tahrirda vaqt oʻzgaradi
    const edited = await call('PATCH', `/api/visits/${withTime.json().data.id}`, { time: '09:05' })
    expect(edited.json().data.time).toBe('09:05')
    // Roʻyxatda bir kun ichida vaqt boʻyicha kamayib: 14:30 li tashrif
    // 09:05 lidan oldin turadi
    await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-01',
      time: '14:30',
      treatment: 'Tushdan keyin',
    })
    const list = (await call('GET', `/api/patients/${patientId}/visits`)).json().data
    const times = list
      .filter((v: { date: string }) => v.date.startsWith('2026-09-01'))
      .map((v: { time: string | null }) => v.time)
    expect(times.indexOf('14:30')).toBeLessThan(times.indexOf('09:05'))
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

describe('tashrif shifokori', () => {
  it('berilmasa yozgan odamning oʻzi', async () => {
    const r = await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-01',
      treatment: 'Koʻrik',
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.doctorId).toBe(h.userId)
    expect(typeof r.json().data.doctorName).toBe('string')
  })

  it('boshqa shifokor tanlanadi va ismi javobda keladi', async () => {
    const created = await call('POST', '/api/staff', {
      email: `shifokor-${h.clinicId.slice(0, 8)}@sinov.uz`,
      fullName: 'Aliyev Bobur',
      roleId: (
        await h.ownerDb.role.findFirst({ where: { clinicId: h.clinicId, template: 'shifokor' } })
      )?.id,
      password: 'parol12345',
    })
    const doctorId = created.json().data.id as string

    const r = await call('POST', '/api/visits', {
      patientId,
      doctorId,
      date: '2026-09-01',
      treatment: 'Plomba',
      price: 300_000,
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({ doctorId, doctorName: 'Aliyev Bobur' })

    // Faolsizlantirilgan xodimga yangi tashrif yozilmaydi
    await call('PATCH', `/api/staff/${doctorId}`, { status: 'disabled' })
    const again = await call('POST', '/api/visits', {
      patientId,
      doctorId,
      date: '2026-09-02',
      treatment: 'Plomba',
    })
    expect(again.statusCode).toBe(400)
    expect(again.json().error.fields.doctorId).toBe('Bu xodim tashrifga shifokor boʻla olmaydi')
  })

  it('visits.write siz xodim (texnik) shifokor boʻla olmaydi', async () => {
    const tech = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'texnik' },
    })
    const created = await call('POST', '/api/staff', {
      email: `texnik-${h.clinicId.slice(0, 8)}@sinov.uz`,
      fullName: 'Texnik Toʻra',
      roleId: tech?.id,
      password: 'parol12345',
    })
    const r = await call('POST', '/api/visits', {
      patientId,
      doctorId: created.json().data.id,
      date: '2026-09-01',
      treatment: 'Plomba',
    })
    expect(r.statusCode).toBe(400)
  })

  it('shifokorlar roʻyxati — faqat faol va visits.write li xodimlar', async () => {
    const r = await call('GET', '/api/staff/doctors')
    expect(r.statusCode).toBe(200)
    const names = r.json().data.map((d: { fullName: string }) => d.fullName)
    expect(names).not.toContain('Aliyev Bobur') // faolsizlantirilgan
    expect(names).not.toContain('Texnik Toʻra') // visits.write yoʻq
    expect(r.json().data.some((d: { id: string }) => d.id === h.userId)).toBe(true)
  })
})

describe('shifokor ulushi (snapshot)', () => {
  let doctorId = ''

  async function shareOf(visitId: string) {
    const row = await h.ownerDb.visit.findUnique({
      where: { id: visitId },
      select: { doctorPercent: true, doctorShare: true, price: true },
    })
    return row as { doctorPercent: number; doctorShare: number; price: number }
  }

  beforeAll(async () => {
    const role = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'shifokor' },
    })
    const created = await call('POST', '/api/staff', {
      email: `foizli-${h.clinicId.slice(0, 8)}@sinov.uz`,
      fullName: 'Foizli Shifokor',
      roleId: role?.id,
      password: 'parol12345',
      payPercent: 50,
    })
    doctorId = created.json().data.id
  })

  it('yozishda joriy foiz va ulush muzlatiladi; yaxlitlash butun soʻmga', async () => {
    const r = await call('POST', '/api/visits', {
      patientId,
      doctorId,
      date: '2026-09-01',
      treatment: 'Plomba',
      price: 300_000,
    })
    expect(await shareOf(r.json().data.id)).toEqual({
      price: 300_000,
      doctorPercent: 50,
      doctorShare: 150_000,
    })
    // Roʻyxat javobida ulush yoʻq — bemor kartochkasini koʻrgan har kimga
    // shifokorning foizi koʻrinmasin
    expect(r.json().data.doctorShare).toBeUndefined()

    const odd = await call('POST', '/api/visits', {
      patientId,
      doctorId,
      date: '2026-09-01',
      treatment: 'Plomba',
      price: 333_333,
    })
    expect((await shareOf(odd.json().data.id)).doctorShare).toBe(166_667)
  })

  it('narx tahrirlansa saqlangan foiz bilan qayta sanaladi', async () => {
    const r = await call('POST', '/api/visits', {
      patientId,
      doctorId,
      date: '2026-09-01',
      treatment: 'Plomba',
      price: 100_000,
    })
    const id = r.json().data.id
    // Shifokorning foizi oʻzgardi — bu eski tashrifga tegmaydi
    await call('PATCH', `/api/staff/${doctorId}`, { payPercent: 40 })
    expect(await shareOf(id)).toMatchObject({ doctorPercent: 50, doctorShare: 50_000 })

    await call('PATCH', `/api/visits/${id}`, { price: 200_000 })
    expect(await shareOf(id)).toEqual({ price: 200_000, doctorPercent: 50, doctorShare: 100_000 })
  })

  it('shifokor almashsa yangi shifokorning joriy foizi olinadi', async () => {
    const r = await call('POST', '/api/visits', {
      patientId,
      date: '2026-09-01',
      treatment: 'Plomba',
      price: 100_000,
    })
    const id = r.json().data.id
    // Egasi (h.userId) — foizsiz
    expect(await shareOf(id)).toMatchObject({ doctorPercent: 0, doctorShare: 0 })

    await call('PATCH', `/api/visits/${id}`, { doctorId })
    expect(await shareOf(id)).toMatchObject({ doctorPercent: 40, doctorShare: 40_000 })
  })

  it('texnik narxi: ulush (narx − texnik) dan; tahrirlansa qayta sanaladi', async () => {
    // Shifokor foizi hozir 40
    const r = await call('POST', '/api/visits', {
      patientId,
      doctorId,
      date: '2026-09-01',
      treatment: 'Metall-keramika koronka',
      price: 1_000_000,
      labCost: 300_000,
    })
    const id = r.json().data.id
    expect(await shareOf(id)).toEqual({ price: 1_000_000, doctorPercent: 40, doctorShare: 280_000 })
    const row = await h.ownerDb.visit.findUnique({ where: { id }, select: { labCost: true } })
    expect(row?.labCost).toBe(300_000)

    await call('PATCH', `/api/visits/${id}`, { labCost: 500_000 })
    expect((await shareOf(id)).doctorShare).toBe(200_000)
    // Faqat izoh — texnik narxi va ulush joyida
    await call('PATCH', `/api/visits/${id}`, { note: 'izoh' })
    expect((await shareOf(id)).doctorShare).toBe(200_000)
  })

  it('narxsiz PATCH narxni va ulushni buzmaydi', async () => {
    const r = await call('POST', '/api/visits', {
      patientId,
      doctorId,
      date: '2026-09-01',
      treatment: 'Plomba',
      price: 100_000,
    })
    const id = r.json().data.id
    await call('PATCH', `/api/visits/${id}`, { note: 'faqat izoh' })
    expect(await shareOf(id)).toEqual({ price: 100_000, doctorPercent: 40, doctorShare: 40_000 })
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

  it('begona klinikaning xodimi shifokor boʻla olmaydi', async () => {
    const role = await h.ownerDb.role.create({
      data: {
        clinicId: otherClinicId,
        template: 'shifokor',
        name: 'Shifokor',
        permissions: ['visits.write'],
      },
    })
    const foreignDoctor = await h.ownerDb.user.create({
      data: {
        clinicId: otherClinicId,
        roleId: role.id,
        email: `begona-shifokor-${otherClinicId.slice(0, 8)}@sinov.uz`,
        passwordHash: 'x',
        fullName: 'Begona Shifokor',
        emailVerifiedAt: new Date(),
      },
    })
    const r = await call('POST', '/api/visits', {
      patientId,
      doctorId: foreignDoctor.id,
      date: '2026-09-01',
      treatment: 'Plomba',
    })
    expect(r.statusCode).toBe(400)
    expect(await h.ownerDb.visit.count({ where: { doctorId: foreignDoctor.id } })).toBe(0)
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
