// Assistent koʻrinishi (tz.md 20-boʻlim): `patients.all` / `schedule.all`
// yoʻq assistent biriktirilgan shifokorlarining bemorlari, kartochkadagi
// tashriflari, qabullari va navbatini koʻradi — boshqa shifokornikini emas.
// Bogʻlanish olinsa yoki shifokor faolsizlantirilsa — darhol yopiladi

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Harness, startHarness } from '../../test-support/harness.js'

let h: Harness

function as(cookie: string) {
  return (method: 'GET' | 'POST' | 'PATCH', url: string, payload?: object) =>
    h.app.inject({ method, url, payload, headers: { cookie } })
}
const owner = () => as(h.cookie)

let doctor1 = ''
let doctor2 = ''
let assistantId = ''
let assistant: ReturnType<typeof as>

/// Bemorlar: 1-shifokorniki, 2-shifokorniki, hech kimniki
let ofDoctor1 = ''
let ofDoctor2 = ''
let nobodys = ''

async function roleId(template: string): Promise<string> {
  const roles = await h.ownerDb.role.findMany({ where: { clinicId: h.clinicId } })
  return roles.find((role) => role.template === template)?.id ?? ''
}

async function addStaff(name: string, template: string, extra: object = {}) {
  const email = `${name.replace(/\s/g, '-').toLowerCase()}-${h.clinicId.slice(0, 8)}@sinov.uz`
  const r = await owner()('POST', '/api/staff', {
    email,
    fullName: name,
    roleId: await roleId(template),
    password: 'juda-yaxshi-parol',
    ...extra,
  })
  if (r.statusCode !== 200) throw new Error(`staff: ${r.body}`)
  return { id: r.json().data.id as string, email }
}

async function login(email: string): Promise<string> {
  const r = await h.app.inject({
    method: 'POST',
    url: '/api/auth/login',
    remoteAddress: h.clientIp,
    payload: { email, password: 'juda-yaxshi-parol' },
  })
  return `ed_session=${r.cookies.find((c) => c.name === 'ed_session')?.value}`
}

const idsOf = (items: { id: string }[]) => items.map((item) => item.id)

beforeAll(async () => {
  h = await startHarness()
  doctor1 = (await addStaff('Birinchi Shifokor', 'shifokor')).id
  doctor2 = (await addStaff('Ikkinchi Shifokor', 'shifokor')).id
  const a = await addStaff('Yordamchi', 'assistent', { doctorIds: [doctor1] })
  assistantId = a.id
  assistant = as(await login(a.email))

  const patient = async (fio: string, doctorId?: string) =>
    (await owner()('POST', '/api/patients', { fio, doctorId })).json().data.id as string
  ofDoctor1 = await patient('Birinchining Bemori', doctor1)
  ofDoctor2 = await patient('Ikkinchining Bemori', doctor2)
  nobodys = await patient('Hech Kimniki')

  // 1-shifokor bemoriga 2-shifokor ham tashrif yozgan — kartochkada
  // assistent faqat 1-shifokorning tashrifini koʻradi
  for (const doctorId of [doctor1, doctor2]) {
    const v = await owner()('POST', '/api/visits', {
      patientId: ofDoctor1,
      doctorId,
      date: '2026-09-10',
      treatment: 'Plomba',
      price: 100_000,
    })
    if (v.statusCode !== 200) throw new Error(`visit: ${v.body}`)
  }
  for (const [patientId, doctorId] of [
    [ofDoctor1, doctor1],
    [ofDoctor2, doctor2],
  ]) {
    await owner()('POST', '/api/appointments', {
      patientId,
      doctorId,
      date: '2027-05-05',
      time: doctorId === doctor1 ? '10:00' : '11:00',
    })
  }
}, 30_000)

afterAll(async () => {
  await h.stop()
})

describe('bemorlar va kartochka', () => {
  it('sessiyada doira — interfeys shifokor tanlovini shu bilan toraytiradi', async () => {
    const r = await assistant('GET', '/api/me')
    expect(r.json().data.scopeDoctorIds).toEqual([doctor1])
  })

  it('oʻz shifokorining bemori va hech kimniki koʻrinadi, boshqa shifokorniki yoʻq', async () => {
    const r = await assistant('GET', '/api/patients?page=1&pageSize=100')
    const ids = idsOf(r.json().data.items)
    expect(ids).toContain(ofDoctor1)
    expect(ids).toContain(nobodys)
    expect(ids).not.toContain(ofDoctor2)
  })

  it('boshqa shifokorning bemori kartochkasi — «topilmadi»', async () => {
    expect((await assistant('GET', `/api/patients/${ofDoctor2}`)).statusCode).toBe(404)
    expect((await assistant('GET', `/api/patients/${ofDoctor2}/visits`)).statusCode).toBe(404)
  })

  it('kartochkada faqat oʻz shifokorining tashriflari', async () => {
    const r = await assistant('GET', `/api/patients/${ofDoctor1}/visits`)
    expect(r.statusCode).toBe(200)
    const doctors = r.json().data.map((v: { doctorId: string }) => v.doctorId)
    expect(doctors).toEqual([doctor1])
  })

  it('tashrif yoza olmaydi — bu shifokor ulushi', async () => {
    const r = await assistant('POST', '/api/visits', {
      patientId: ofDoctor1,
      date: '2026-09-11',
      treatment: 'Plomba',
      price: 100_000,
    })
    expect(r.statusCode).toBe(403)
  })
})

describe('shifokor boʻyicha filtr', () => {
  it('«biriktirilmagan» — faqat shifokorsiz bemorlar', async () => {
    const r = await owner()('GET', '/api/patients?page=1&pageSize=100&doctorId=none')
    const items = r.json().data.items as { id: string; doctorId: string | null }[]
    expect(idsOf(items)).toContain(nobodys)
    expect(items.every((item) => item.doctorId === null)).toBe(true)
  })

  it('assistent doirasidan tashqari shifokorni filtrlab ham koʻra olmaydi', async () => {
    const r = await assistant('GET', `/api/patients?page=1&pageSize=100&doctorId=${doctor2}`)
    expect(idsOf(r.json().data.items)).not.toContain(ofDoctor2)
  })
})

describe('qabul jadvali', () => {
  it('faqat oʻz shifokorining qabullari', async () => {
    const r = await assistant('GET', '/api/appointments?from=2027-05-05&to=2027-05-05')
    const doctors = r.json().data.map((a: { doctorId: string }) => a.doctorId)
    expect(doctors).toEqual([doctor1])
  })

  it('boshqa shifokorga yozmoqchi boʻlsa — oʻz shifokoriga tushadi', async () => {
    const r = await assistant('POST', '/api/appointments', {
      patientId: ofDoctor1,
      doctorId: doctor2,
      date: '2027-05-06',
      time: '09:00',
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.doctorId).toBe(doctor1)
  })
})

describe('navbat', () => {
  let foreignEntry = ''

  beforeAll(async () => {
    const r = await owner()('POST', '/api/queue', { patientId: ofDoctor2, doctorId: doctor2 })
    foreignEntry = r.json().data.find((e: { patientId: string }) => e.patientId === ofDoctor2).id
  })

  it('boshqa shifokorga yoʻnaltira olmaydi', async () => {
    const r = await assistant('POST', '/api/queue', { patientId: ofDoctor1, doctorId: doctor2 })
    expect(r.statusCode).toBe(400)
  })

  it('oʻz shifokoriga qoʻshadi va roʻyxatda faqat oʻz shifokoriniki', async () => {
    const r = await assistant('POST', '/api/queue', { patientId: ofDoctor1, doctorId: doctor1 })
    expect(r.statusCode).toBe(200)
    const doctors = r.json().data.map((e: { doctorId: string }) => e.doctorId)
    expect(doctors).toEqual([doctor1])
  })

  it('boshqa shifokorning navbat yozuviga amal — «topilmadi»', async () => {
    const r = await assistant('PATCH', `/api/queue/${foreignEntry}`, { action: 'call' })
    expect(r.statusCode).toBe(404)
  })
})

describe('doira oʻzgarsa — darhol', () => {
  it('ikkinchi shifokor qoʻshilsa uning bemori ochiladi', async () => {
    await owner()('PATCH', `/api/staff/${assistantId}`, { doctorIds: [doctor1, doctor2] })
    expect((await assistant('GET', `/api/patients/${ofDoctor2}`)).statusCode).toBe(200)
  })

  // `ofDoctor1` ga 2-shifokor ham tashrif yozgan — u 2-shifokor orqali
  // koʻrinishda qoladi. Shuning uchun faqat 1-shifokorga tegishli bemor
  it('bogʻlanish olinsa — keyingi soʻrovdayoq yopiladi', async () => {
    const only1 = (
      await owner()('POST', '/api/patients', { fio: 'Faqat Birinchiniki', doctorId: doctor1 })
    ).json().data.id as string
    expect((await assistant('GET', `/api/patients/${only1}`)).statusCode).toBe(200)

    await owner()('PATCH', `/api/staff/${assistantId}`, { doctorIds: [doctor2] })
    expect((await assistant('GET', `/api/patients/${only1}`)).statusCode).toBe(404)
  })

  it('shifokor faolsizlantirilsa uning bemorlari assistentga yopiladi', async () => {
    await owner()('PATCH', `/api/staff/${doctor2}`, { status: 'disabled' })
    expect((await assistant('GET', `/api/patients/${ofDoctor2}`)).statusCode).toBe(404)
    // Hech kimniki esa ochiq qoladi — uni kimdir qabul qilishi kerak
    expect((await assistant('GET', `/api/patients/${nobodys}`)).statusCode).toBe(200)
  })
})
