// Shifokor faqat oʻz bemorlarini koʻradi (tz.md 14-boʻlim, 11-bosqich):
// biriktirilgan, oʻzi davolagan yoki unga qabulga yozilgan. Kartochkada oʻz
// tashriflari va oʻz rasmlari; tish xaritasi umumiy. `patients.all` (egasi,
// qabulxona, kuzatuvchi) hammasini ochadi.

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Harness, startHarness } from '../../test-support/harness.js'

let h: Harness

/// Ikki shifokor: A va B. Egasi (patients.all) hammasini koʻradi
let doctorA = { id: '', cookie: '' }
let doctorB = { id: '', cookie: '' }

/// Bemorlar: A ga biriktirilgan; A ga biriktirilgan, lekin B davolagan;
/// B ga biriktirilgan, lekin A ga qabulga yozilgan; hech kimga biriktirilmagan
let assignedToA = ''
let treatedByB = ''
let bookedToA = ''
let nobodys = ''

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

function as(cookie: string) {
  return (method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, payload?: object) =>
    h.app.inject({ method, url, payload, headers: { cookie } })
}
const owner = () => as(h.cookie)

function upload(cookie: string, patientId: string) {
  const boundary = '----edentist'
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="r.png"\r\n` +
      'Content-Type: image/png\r\n\r\n',
  )
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
  return h.app.inject({
    method: 'POST',
    url: `/api/patients/${patientId}/images`,
    headers: { cookie, 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload: Buffer.concat([head, PNG, tail]),
  })
}

async function createDoctor(name: string) {
  const roles = await h.ownerDb.role.findMany({ where: { clinicId: h.clinicId } })
  const role = roles.find((r) => r.template === 'shifokor')
  const email = `${name}-${h.clinicId.slice(0, 8)}@sinov.uz`
  const created = await owner()('POST', '/api/staff', {
    email,
    fullName: `Shifokor ${name}`,
    roleId: role?.id,
    password: 'juda-yaxshi-parol',
    payPercent: 40,
  })
  const login = await h.app.inject({
    method: 'POST',
    url: '/api/auth/login',
    remoteAddress: h.clientIp,
    payload: { email, password: 'juda-yaxshi-parol' },
  })
  return {
    id: created.json().data.id as string,
    cookie: `ed_session=${login.cookies.find((c) => c.name === 'ed_session')?.value}`,
  }
}

beforeAll(async () => {
  h = await startHarness()
  doctorA = await createDoctor('korinish-a')
  doctorB = await createDoctor('korinish-b')

  const patient = async (fio: string, doctorId?: string) =>
    (await owner()('POST', '/api/patients', { fio, doctorId })).json().data.id as string

  assignedToA = await patient('Biriktirilgan A')
  treatedByB = await patient('Davolangan B')
  bookedToA = await patient('Qabulga A', doctorB.id)
  nobodys = await patient('Hech Kimniki')

  // Egasi A ga biriktiradi; B biriktirilmagan bemorga tashrif yozadi, keyin
  // egasi uni A ga biriktiradi — B baribir koʻradi (davolagan); A ga qabul
  await owner()('PATCH', `/api/patients/${assignedToA}`, { doctorId: doctorA.id })
  const visit = await as(doctorB.cookie)('POST', '/api/visits', {
    patientId: treatedByB,
    date: '2026-09-10',
    treatment: 'Plomba',
    price: 100_000,
  })
  if (visit.statusCode !== 200) throw new Error(`visit: ${visit.body}`)
  await owner()('PATCH', `/api/patients/${treatedByB}`, { doctorId: doctorA.id })
  await owner()('POST', '/api/appointments', {
    patientId: bookedToA,
    date: '2027-05-05',
    time: '10:00',
    doctorId: doctorA.id,
  })
}, 30_000)

afterAll(async () => {
  await h.stop()
})

describe('roʻyxat va kartochka', () => {
  it('shifokor A: biriktirilgan, qabulga yozilgan va biriktirilmagan koʻrinadi', async () => {
    const r = await as(doctorA.cookie)('GET', '/api/patients?page=1&pageSize=100')
    const ids = r.json().data.items.map((p: { id: string }) => p.id)
    expect(ids).toContain(assignedToA)
    expect(ids).toContain(bookedToA)
    expect(ids).toContain(treatedByB)
    expect(ids).toContain(nobodys)
  })

  it('shifokor B: davolagani (A ga biriktirilgan boʻlsa ham) koʻrinadi, A niki yoʻq', async () => {
    const r = await as(doctorB.cookie)('GET', '/api/patients?page=1&pageSize=100')
    const ids = r.json().data.items.map((p: { id: string }) => p.id)
    expect(ids).toContain(treatedByB)
    expect(ids).toContain(nobodys)
    expect(ids).toContain(bookedToA)
    expect(ids).not.toContain(assignedToA)
  })

  it('boshqaning kartochkasi — topilmadi; tahrir va oʻchirish ham', async () => {
    const b = as(doctorB.cookie)
    expect((await b('GET', `/api/patients/${assignedToA}`)).statusCode).toBe(404)
    expect((await b('PATCH', `/api/patients/${assignedToA}`, { note: 'x' })).statusCode).toBe(404)
    expect((await b('DELETE', `/api/patients/${assignedToA}`)).statusCode).toBe(404)
    expect((await b('GET', `/api/patients/${assignedToA}/teeth`)).statusCode).toBe(404)
    expect((await b('GET', `/api/patients/${assignedToA}/balance`)).statusCode).toBe(404)
  })

  it('egasi (patients.all) hammasini koʻradi', async () => {
    const r = await owner()('GET', '/api/patients?page=1&pageSize=100')
    const ids = r.json().data.items.map((p: { id: string }) => p.id)
    for (const id of [assignedToA, treatedByB, bookedToA, nobodys]) expect(ids).toContain(id)
  })

  it('shifokor boshqaning bemoriga tashrif, toʻlov, qabul yozolmaydi', async () => {
    const b = as(doctorB.cookie)
    const visit = await b('POST', '/api/visits', {
      patientId: assignedToA,
      date: '2026-09-10',
      treatment: 'Koʻrik',
      price: 0,
    })
    expect(visit.statusCode).toBe(404)
    const payment = await b('POST', '/api/payments', {
      patientId: assignedToA,
      date: '2026-09-10',
      amount: 1000,
    })
    expect(payment.statusCode).toBe(404)
    const appointment = await b('POST', '/api/appointments', {
      patientId: assignedToA,
      date: '2027-05-06',
      time: '10:00',
    })
    expect(appointment.statusCode).toBe(404)
  })
})

describe('bitta bemorni ikki shifokor davolasa', () => {
  let shared = ''
  let visitA = ''

  beforeAll(async () => {
    shared = (await owner()('POST', '/api/patients', { fio: 'Umumiy Bemor' })).json().data.id
    // Egasi ikkalasiga ham qabul yozadi — ikkalasi ham koʻradi
    for (const doctorId of [doctorA.id, doctorB.id]) {
      await owner()('POST', '/api/appointments', {
        patientId: shared,
        date: '2027-05-07',
        time: doctorId === doctorA.id ? '09:00' : '11:00',
        doctorId,
      })
    }
    const a = await as(doctorA.cookie)('POST', '/api/visits', {
      patientId: shared,
      date: '2026-09-11',
      treatment: 'A muolajasi',
      price: 200_000,
      // Cheklangan shifokor boshqa nomidan yozolmaydi — B berilsa ham A boʻladi
      doctorId: doctorB.id,
    })
    visitA = a.json().data.id
    await as(doctorB.cookie)('POST', '/api/visits', {
      patientId: shared,
      date: '2026-09-12',
      treatment: 'B muolajasi',
      price: 300_000,
    })
  })

  it('tashrif doim oʻz nomidan yoziladi', async () => {
    const row = await h.ownerDb.visit.findUnique({ where: { id: visitA } })
    expect(row?.doctorId).toBe(doctorA.id)
  })

  it('har biri faqat oʻz tashriflarini koʻradi; egasi ikkalasini', async () => {
    const a = (await as(doctorA.cookie)('GET', `/api/patients/${shared}/visits`)).json().data
    expect(a.map((v: { treatment: string }) => v.treatment)).toEqual(['A muolajasi'])
    const b = (await as(doctorB.cookie)('GET', `/api/patients/${shared}/visits`)).json().data
    expect(b.map((v: { treatment: string }) => v.treatment)).toEqual(['B muolajasi'])
    const all = (await owner()('GET', `/api/patients/${shared}/visits`)).json().data
    expect(all).toHaveLength(2)
  })

  it('boshqaning tashrifini tahrirlab, oʻchirib boʻlmaydi', async () => {
    const b = as(doctorB.cookie)
    expect((await b('PATCH', `/api/visits/${visitA}`, { note: 'x' })).statusCode).toBe(404)
    expect((await b('DELETE', `/api/visits/${visitA}`)).statusCode).toBe(404)
    // Oʻzinikida shifokorni oʻzgartirib boʻlmaydi — oʻzida qoladi
    const own = await as(doctorA.cookie)('PATCH', `/api/visits/${visitA}`, {
      doctorId: doctorB.id,
    })
    expect(own.statusCode).toBe(200)
    expect(own.json().data.doctorId).toBe(doctorA.id)
  })

  it('tish xaritasi umumiy: A qoʻygan holatni B koʻradi', async () => {
    await as(doctorA.cookie)('PUT', `/api/patients/${shared}/teeth/16`, { status: 'plomba' })
    const chart = (await as(doctorB.cookie)('GET', `/api/patients/${shared}/teeth`)).json().data
    expect(chart.teeth.find((t: { tooth: number }) => t.tooth === 16)?.status).toBe('plomba')
  })

  it('rasmlar: har biri oʻzi yuklaganini koʻradi; egasi hammasini', async () => {
    const upA = await upload(doctorA.cookie, shared)
    expect(upA.statusCode).toBe(200)
    const imageA = upA.json().data.id
    await upload(doctorB.cookie, shared)

    const a = (await as(doctorA.cookie)('GET', `/api/patients/${shared}/images`)).json().data
    expect(a.map((i: { id: string }) => i.id)).toEqual([imageA])
    const b = (await as(doctorB.cookie)('GET', `/api/patients/${shared}/images`)).json().data
    expect(b.map((i: { id: string }) => i.id)).not.toContain(imageA)
    const all = (await owner()('GET', `/api/patients/${shared}/images`)).json().data
    expect(all).toHaveLength(2)

    // Faylning oʻzi ham, oʻchirish ham — boshqaniki yoʻq
    expect((await as(doctorB.cookie)('GET', `/api/images/${imageA}/file`)).statusCode).toBe(404)
    expect((await as(doctorB.cookie)('DELETE', `/api/images/${imageA}`)).statusCode).toBe(404)
    expect((await as(doctorA.cookie)('GET', `/api/images/${imageA}/file`)).statusCode).toBe(200)
  })

  it('qarzdorlar roʻyxati ham oʻz bemorlari bilan chegaralangan', async () => {
    // Umumiy bemorda qarz bor (500 000); B davolagan bemor (100 000) A ga
    // biriktirilgan, lekin B koʻradi — A ham koʻradi. Toza tekshiruv: B
    // uchun assignedToA yoʻq
    await owner()('POST', '/api/visits', {
      patientId: assignedToA,
      date: '2026-09-10',
      treatment: 'Koʻrik',
      price: 50_000,
      doctorId: doctorA.id,
    })
    const b = (await as(doctorB.cookie)('GET', '/api/debtors')).json().data
    const ids = b.items.map((d: { patientId: string }) => d.patientId)
    expect(ids).toContain(shared)
    expect(ids).not.toContain(assignedToA)
  })

  it('patients.all berilsa shifokor hammasini koʻradi', async () => {
    const role = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'shifokor' },
    })
    await owner()('PATCH', `/api/roles/${role?.id}`, {
      permissions: [...(role?.permissions ?? []), 'patients.all'],
    })
    const r = await as(doctorB.cookie)('GET', `/api/patients/${assignedToA}`)
    expect(r.statusCode).toBe(200)
    const visits = (await as(doctorB.cookie)('GET', `/api/patients/${shared}/visits`)).json().data
    expect(visits).toHaveLength(2)
    await owner()('PATCH', `/api/roles/${role?.id}`, { permissions: role?.permissions ?? [] })
  })
})
