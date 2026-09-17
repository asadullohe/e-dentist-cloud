import { APPOINTMENT_TEXT } from '@e-dentist/shared'
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

  const created = await call('POST', '/api/patients', { fio: 'Qabul Bemori' })
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

describe('qabul yozish', () => {
  it('yoziladi va bemor nomi bilan qaytadi', async () => {
    const r = await call('POST', '/api/appointments', {
      patientId,
      date: '2026-09-15',
      time: '14:30',
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({ fio: 'Qabul Bemori', status: 'scheduled' })
  })

  it('notoʻgʻri vaqt rad etiladi', async () => {
    for (const time of ['25:00', '14.30', 'ertalab']) {
      const r = await call('POST', '/api/appointments', { patientId, date: '2026-09-15', time })
      expect(r.statusCode, time).toBe(400)
      expect(r.json().error.fields.time).toMatch(/soat:daqiqa/)
    }
  })

  // Kelajakdagi qabul — oddiy hol, tashrifdan farqi shu
  it('kelajakdagi sana qabul uchun oddiy hol', async () => {
    const r = await call('POST', '/api/appointments', {
      patientId,
      date: '2099-01-01',
      time: '09:00',
    })
    expect(r.statusCode).toBe(200)
  })
})

describe('qabulda shifokor', () => {
  let doctorId = ''
  let doctorPatientId = ''

  beforeAll(async () => {
    const role = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'shifokor' },
    })
    const created = await call('POST', '/api/staff', {
      email: `qabul-shifokor-${h.clinicId.slice(0, 8)}@sinov.uz`,
      fullName: 'Qabul Shifokori',
      roleId: role?.id,
      password: 'juda-yaxshi-parol',
    })
    doctorId = created.json().data.id
    // Biriktirilgan shifokori bor bemor
    const patient = await call('POST', '/api/patients', { fio: 'Biriktirilgan Bemor', doctorId })
    doctorPatientId = patient.json().data.id
  })

  it('berilmasa bemorning biriktirilgan shifokori olinadi', async () => {
    const r = await call('POST', '/api/appointments', {
      patientId: doctorPatientId,
      date: '2027-03-05',
      time: '10:00',
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({ doctorId, doctorName: 'Qabul Shifokori' })
  })

  it('aniq berilsa oʻsha, null boʻlsa shifokorsiz', async () => {
    const r = await call('POST', '/api/appointments', {
      patientId: doctorPatientId,
      doctorId: null,
      date: '2027-03-05',
      time: '11:00',
    })
    expect(r.json().data).toMatchObject({ doctorId: null, doctorName: null })

    const changed = await call('PATCH', `/api/appointments/${r.json().data.id}`, { doctorId })
    expect(changed.json().data.doctorName).toBe('Qabul Shifokori')
  })

  it('roʻyxat shifokor boʻyicha filtrlanadi', async () => {
    const r = await call(
      'GET',
      `/api/appointments?from=2027-03-05&to=2027-03-05&doctorId=${doctorId}`,
    )
    const rows = r.json().data as { doctorId: string | null }[]
    expect(rows.length).toBe(2)
    expect(rows.every((row) => row.doctorId === doctorId)).toBe(true)
  })

  it('shifokor boʻlmagan xodim rad etiladi', async () => {
    const tech = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'texnik' },
    })
    const created = await call('POST', '/api/staff', {
      email: `qabul-texnik-${h.clinicId.slice(0, 8)}@sinov.uz`,
      fullName: 'Texnik',
      roleId: tech?.id,
      password: 'juda-yaxshi-parol',
    })
    const r = await call('POST', '/api/appointments', {
      patientId: doctorPatientId,
      doctorId: created.json().data.id,
      date: '2027-03-06',
      time: '10:00',
    })
    expect(r.statusCode).toBe(400)
  })
})

describe('qabulni yakunlash — tashrif yoziladi', () => {
  let doctorId = ''
  let doctorPatientId = ''

  beforeAll(async () => {
    const roles = await h.ownerDb.role.findMany({ where: { clinicId: h.clinicId } })
    const doctorRole = roles.find((role) => role.template === 'shifokor')
    const created = await call('POST', '/api/staff', {
      email: `yakun-shifokor-${h.clinicId.slice(0, 8)}@sinov.uz`,
      fullName: 'Yakun Shifokori',
      roleId: doctorRole?.id,
      password: 'juda-yaxshi-parol',
      payPercent: 50,
    })
    doctorId = created.json().data.id
    const patient = await call('POST', '/api/patients', { fio: 'Yakun Bemori', doctorId })
    doctorPatientId = patient.json().data.id
  })

  it('tashrif qabul shifokoriga, qabul sanasi bilan yoziladi; holat «done»', async () => {
    const appointment = (
      await call('POST', '/api/appointments', {
        patientId: doctorPatientId,
        date: '2026-04-10',
        time: '09:30',
      })
    ).json().data
    expect(appointment.doctorId).toBe(doctorId)

    const r = await call('POST', `/api/appointments/${appointment.id}/complete`, {
      treatment: 'Plomba',
      tooth: 16,
      price: 300_000,
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.appointment.status).toBe('done')
    expect(r.json().data.visit).toMatchObject({
      patientId: doctorPatientId,
      doctorId,
      treatment: 'Plomba',
      price: 300_000,
    })
    expect(r.json().data.visit.date.slice(0, 10)).toBe('2026-04-10')

    // Bemorning tashriflarida bor, ulush hisoblangan (50%)
    const visits = (await call('GET', `/api/patients/${doctorPatientId}/visits`)).json().data
    expect(visits.some((v: { id: string }) => v.id === r.json().data.visit.id)).toBe(true)
    const row = await h.ownerDb.visit.findUnique({ where: { id: r.json().data.visit.id } })
    expect(row?.doctorShare).toBe(150_000)
  })

  // Kelajakdagi qabul bugun yakunlansa — ish bugun qilingan, tashrif bugungi
  it('kelajakdagi qabul yakunlansa tashrif bugungi sana bilan yoziladi', async () => {
    const appointment = (
      await call('POST', '/api/appointments', {
        patientId: doctorPatientId,
        date: '2027-04-10',
        time: '09:30',
      })
    ).json().data
    const r = await call('POST', `/api/appointments/${appointment.id}/complete`, {
      treatment: 'Koʻrik',
      price: 0,
    })
    expect(r.statusCode).toBe(200)
    const today = new Date()
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(r.json().data.visit.date.slice(0, 10)).toBe(iso)
  })

  it('yakunlangan qabulni ikkinchi marta yakunlab boʻlmaydi', async () => {
    const appointment = (
      await call('POST', '/api/appointments', {
        patientId: doctorPatientId,
        date: '2027-04-11',
        time: '09:30',
      })
    ).json().data
    await call('POST', `/api/appointments/${appointment.id}/complete`, {
      treatment: 'Koʻrik',
      price: 0,
    })
    const again = await call('POST', `/api/appointments/${appointment.id}/complete`, {
      treatment: 'Koʻrik',
      price: 0,
    })
    expect(again.statusCode).toBe(409)
    expect(again.json().error.message).toBe('Bu qabul allaqachon yakunlangan')
  })

  it('shifokor aniq berilsa oʻsha; yaroqsiz boʻlsa tashrif ham, holat ham yozilmaydi', async () => {
    const appointment = (
      await call('POST', '/api/appointments', {
        patientId: doctorPatientId,
        date: '2027-04-12',
        time: '09:30',
      })
    ).json().data
    const r = await call('POST', `/api/appointments/${appointment.id}/complete`, {
      treatment: 'Plomba',
      price: 100,
      doctorId: '00000000-0000-7000-8000-000000000000',
    })
    expect(r.statusCode).toBe(400)
    const row = await h.ownerDb.appointment.findUnique({ where: { id: appointment.id } })
    expect(row?.status).toBe('scheduled')
  })

  it('begona klinikaning qabuli — topilmadi', async () => {
    const foreign = await h.ownerDb.appointment.create({
      data: {
        clinicId: otherClinicId,
        patientId: otherPatientId,
        at: new Date('2027-04-13T09:00:00'),
      },
    })
    const r = await call('POST', `/api/appointments/${foreign.id}/complete`, {
      treatment: 'Plomba',
      price: 100,
    })
    expect(r.statusCode).toBe(404)
    expect(await h.ownerDb.visit.count({ where: { patientId: otherPatientId } })).toBe(0)
    // Keyingi blok begona qabullar sonini sanaydi
    await h.ownerDb.appointment.delete({ where: { id: foreign.id } })
  })
})

describe('oraliq boʻyicha roʻyxat', () => {
  it('faqat soʻralgan oraliqdagilar', async () => {
    const r = await call('GET', '/api/appointments?from=2026-09-01&to=2026-09-30')
    const dates = r.json().data.map((row: { at: string }) => row.at.slice(0, 10))
    expect(dates).toContain('2026-09-15')
    expect(dates.every((date: string) => date >= '2026-09-01' && date <= '2026-09-30')).toBe(true)
  })

  // Oxirgi kun ham kiritiladi — «to» chegarasi qamrab olinadi
  it('oxirgi kunning qabullari ham chiqadi', async () => {
    await call('POST', '/api/appointments', { patientId, date: '2026-10-31', time: '10:00' })
    const r = await call('GET', '/api/appointments?from=2026-10-01&to=2026-10-31')
    expect(r.json().data).toHaveLength(1)
  })

  it('vaqt boʻyicha tartiblangan', async () => {
    await call('POST', '/api/appointments', { patientId, date: '2026-11-05', time: '16:00' })
    await call('POST', '/api/appointments', { patientId, date: '2026-11-05', time: '09:15' })

    const r = await call('GET', '/api/appointments?from=2026-11-05&to=2026-11-05')
    const times = r.json().data.map((row: { at: string }) => row.at)
    expect(times[0] < times[1]).toBe(true)
  })
})

describe('holatni oʻzgartirish', () => {
  it('keldi / kelmadi', async () => {
    const created = await call('POST', '/api/appointments', {
      patientId,
      date: '2026-12-01',
      time: '11:00',
    })
    const id = created.json().data.id

    for (const status of ['arrived', 'no_show']) {
      const r = await call('PATCH', `/api/appointments/${id}`, { status })
      expect(r.json().data.status).toBe(status)
    }
  })

  // «Yakunlandi» faqat tashrif bilan — PATCH orqali qoʻyib boʻlmaydi (10.6)
  it('PATCH bilan yakunlab boʻlmaydi', async () => {
    const created = await call('POST', '/api/appointments', {
      patientId,
      date: '2026-12-01',
      time: '11:30',
    })
    const r = await call('PATCH', `/api/appointments/${created.json().data.id}`, {
      status: 'done',
    })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.message).toBe(APPOINTMENT_TEXT.done_needs_visit)
  })

  // Sana yoki vaqtdan faqat bittasi kelsa, ikkinchisi eskisidan olinadi
  it('faqat vaqt oʻzgartirilsa sana saqlanadi', async () => {
    const created = await call('POST', '/api/appointments', {
      patientId,
      date: '2026-12-02',
      time: '11:00',
    })
    const id = created.json().data.id

    const r = await call('PATCH', `/api/appointments/${id}`, { time: '15:45' })
    expect(r.json().data.at.slice(0, 10)).toBe('2026-12-02')
    expect(new Date(r.json().data.at).getHours()).toBe(15)
  })
})

describe('koʻp ijarachilik', () => {
  it('begona bemorga qabul yozib boʻlmaydi', async () => {
    const r = await call('POST', '/api/appointments', {
      patientId: otherPatientId,
      date: '2026-09-20',
      time: '10:00',
    })
    expect(r.statusCode).toBe(404)
    expect(await h.ownerDb.appointment.count({ where: { patientId: otherPatientId } })).toBe(0)
  })

  it('begona klinikaning qabullari roʻyxatda koʻrinmaydi', async () => {
    await h.ownerDb.appointment.create({
      data: {
        clinicId: otherClinicId,
        patientId: otherPatientId,
        at: new Date('2026-09-15T10:00:00'),
      },
    })
    const r = await call('GET', '/api/appointments?from=2026-09-01&to=2026-09-30')
    const names = r.json().data.map((row: { fio: string }) => row.fio)
    expect(names).not.toContain('Begona Bemor')
  })

  it('begona qabulni oʻzgartirib boʻlmaydi', async () => {
    const foreign = await h.ownerDb.appointment.findFirst({ where: { clinicId: otherClinicId } })
    const r = await call('PATCH', `/api/appointments/${foreign?.id}`, { status: 'arrived' })
    expect(r.statusCode).toBe(404)
  })
})

describe('ruxsat', () => {
  it('texnik jadvalni koʻra olmaydi — unda bemor ismlari bor', async () => {
    const tech = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'texnik' },
    })
    const owner = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, isOwner: true },
    })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: tech?.id } })
    expect((await call('GET', '/api/appointments?from=2026-09-01&to=2026-09-30')).statusCode).toBe(
      403,
    )

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })
})
