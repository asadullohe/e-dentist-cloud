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
  it('keldi / kelmadi / yakunlandi', async () => {
    const created = await call('POST', '/api/appointments', {
      patientId,
      date: '2026-12-01',
      time: '11:00',
    })
    const id = created.json().data.id

    for (const status of ['arrived', 'no_show', 'done']) {
      const r = await call('PATCH', `/api/appointments/${id}`, { status })
      expect(r.json().data.status).toBe(status)
    }
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
    const r = await call('PATCH', `/api/appointments/${foreign?.id}`, { status: 'done' })
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
