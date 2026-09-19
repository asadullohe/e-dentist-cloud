import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

let h: Harness
let code = ''
let otherClinicId = ''
let doctor = { id: '', cookie: '' }

function as(cookie: string) {
  return (method: 'GET' | 'POST' | 'PATCH', url: string, payload?: object) =>
    h.app.inject({ method, url, payload, headers: { cookie } })
}
const owner = () => as(h.cookie)

/// Ochiq sahifa: cookie yoʻq, har soʻrov boshqa IP dan — cheklovga
/// urilib qolmaslik uchun (queue.test.ts bilan bir xil sabab)
function open(method: 'GET' | 'POST', url: string, payload?: object, ip = randomIp()) {
  return h.app.inject({ method, url, payload, remoteAddress: ip })
}

const IP_PREFIX = `10.${1 + Math.floor(Math.random() * 250)}`
let ipCounter = 0
function randomIp(): string {
  ipCounter += 1
  return `${IP_PREFIX}.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`
}

/// Shifokor: shablonda `feedback.own` yoʻq — test uni rolga qoʻshadi
async function createDoctor() {
  const roles = await h.ownerDb.role.findMany({ where: { clinicId: h.clinicId } })
  const role = roles.find((r) => r.template === 'shifokor')
  if (!role) throw new Error('shifokor roli yoʻq')
  await h.ownerDb.role.update({
    where: { id: role.id },
    data: { permissions: [...role.permissions, 'feedback.own'] },
  })
  const email = `fikr-shifokor-${h.clinicId.slice(0, 8)}@sinov.uz`
  const created = await owner()('POST', '/api/staff', {
    email,
    fullName: 'Fikr Shifokori',
    roleId: role.id,
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

/// Navbat raqami: yozilish → tasdiqlash → chaqirish → (yakunlash)
async function ticket(finish: boolean) {
  const joined = (
    await open('POST', `/api/n/${code}/join`, { doctorId: h.userId, fullName: 'Fikr Bemori' })
  ).json().data
  await owner()('PATCH', `/api/queue/${joined.id}`, { action: 'confirm' })
  await owner()('PATCH', `/api/queue/${joined.id}`, { action: 'call' })
  if (finish) {
    await owner()('POST', `/api/appointments/${joined.id}/complete`, {
      treatment: 'Koʻrik',
      price: 50_000,
    })
  }
  return joined.id as string
}

beforeAll(async () => {
  h = await startHarness()
  const clinic = await h.ownerDb.clinic.findUnique({ where: { id: h.clinicId } })
  code = clinic?.queueCode ?? ''
  doctor = await createDoctor()
  const other = await createOtherClinic(h.ownerDb)
  otherClinicId = other.id
}, 30_000)

afterAll(async () => {
  await removeClinic(h.ownerDb, otherClinicId)
  await h.stop()
})

describe('ochiq sahifa', () => {
  it('klinika, shifokorlar va sharh havolasi', async () => {
    await owner()('PATCH', '/api/clinic/public', {
      publicPhone: '+998 71 200 00 00',
      address: 'Toshkent, Chilonzor 5',
      reviewUrl: 'https://maps.example.com/clinic',
    })
    const r = await open('GET', `/api/f/${code}`)
    expect(r.statusCode).toBe(200)
    const data = r.json().data
    expect(data.clinicName).toContain('Sinov klinikasi')
    expect(data.reviewUrl).toBe('https://maps.example.com/clinic')
    expect(data.doctors.map((d: { id: string }) => d.id)).toContain(doctor.id)
    // Telefon va manzil navbat sahifasida
    const board = (await open('GET', `/api/n/${code}`)).json().data
    expect(board.publicPhone).toBe('+998 71 200 00 00')
    expect(board.address).toBe('Toshkent, Chilonzor 5')
  })

  it('sharh havolasi faqat http(s)', async () => {
    const r = await owner()('PATCH', '/api/clinic/public', {
      publicPhone: '',
      address: '',
      reviewUrl: 'javascript:alert(1)',
    })
    expect(r.statusCode).toBe(400)
  })

  it('notoʻgʻri kod 404', async () => {
    expect((await open('GET', '/api/f/yoqbunday')).statusCode).toBe(404)
  })

  it('navbat yopiq boʻlsa ham fikr yoziladi', async () => {
    await h.ownerDb.clinic.update({ where: { id: h.clinicId }, data: { queueEnabled: false } })
    const r = await open('POST', `/api/f/${code}`, { rating: 5, source: 'qr' })
    await h.ownerDb.clinic.update({ where: { id: h.clinicId }, data: { queueEnabled: true } })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.reviewUrl).toBe('https://maps.example.com/clinic')
  })

  it('baho majburiy va 1–5 oraligʻida', async () => {
    expect((await open('POST', `/api/f/${code}`, {})).statusCode).toBe(400)
    expect((await open('POST', `/api/f/${code}`, { rating: 0 })).statusCode).toBe(400)
    expect((await open('POST', `/api/f/${code}`, { rating: 6 })).statusCode).toBe(400)
    expect((await open('POST', `/api/f/${code}`, { rating: 'a' })).statusCode).toBe(400)
  })

  it('shifokor, teglar, izoh va telefon bilan', async () => {
    const r = await open('POST', `/api/f/${code}`, {
      rating: 2,
      doctorId: doctor.id,
      tags: ['waiting', 'price'],
      comment: 'Uzoq kutdim',
      phone: '+998 90 123 45 67',
      source: 'page',
    })
    expect(r.statusCode).toBe(200)
    const row = await h.ownerDb.feedback.findUnique({ where: { id: r.json().data.id } })
    expect(row?.doctorId).toBe(doctor.id)
    expect(row?.tags).toEqual(['waiting', 'price'])
    expect(row?.source).toBe('page')
    expect(row?.status).toBe('new')
    expect(row?.clinicId).toBe(h.clinicId)
  })

  it('notoʻgʻri teg 400, yoʻq shifokor 404', async () => {
    expect((await open('POST', `/api/f/${code}`, { rating: 4, tags: ['x'] })).statusCode).toBe(400)
    const r = await open('POST', `/api/f/${code}`, {
      rating: 4,
      doctorId: '00000000-0000-7000-8000-000000000000',
    })
    expect(r.statusCode).toBe(404)
  })

  it('bitta qurilmadan kuniga cheklangan', async () => {
    // Hisoblagich Redis da bir kun yashaydi — har ishga tushirish oʻz qurilmasi
    const cookie = `ed_device=fikr-sinov-${Date.now()}-${Math.random()}`
    const post = () =>
      h.app.inject({
        method: 'POST',
        url: `/api/f/${code}`,
        payload: { rating: 5 },
        headers: { cookie },
        remoteAddress: randomIp(),
      })
    for (let i = 0; i < 3; i++) expect((await post()).statusCode).toBe(200)
    expect((await post()).statusCode).toBe(429)
  })
})

describe('navbat raqamidan', () => {
  it('shifokor va bemor raqamdan olinadi, ikkinchisi 409', async () => {
    const id = await ticket(true)
    const r = await open('POST', `/api/f/${code}`, { rating: 5, ticketId: id, doctorId: doctor.id })
    expect(r.statusCode).toBe(200)
    const row = await h.ownerDb.feedback.findUnique({ where: { appointmentId: id } })
    // Soʻrovdagi shifokor emas — raqamdagi
    expect(row?.doctorId).toBe(h.userId)
    expect(row?.patientId).not.toBeNull()
    expect(row?.source).toBe('ticket')

    const again = await open('POST', `/api/f/${code}`, { rating: 1, ticketId: id })
    expect(again.statusCode).toBe(409)
  })

  it('tugamagan raqamga 400, yoʻq raqamga 404', async () => {
    const id = await ticket(false)
    expect((await open('POST', `/api/f/${code}`, { rating: 5, ticketId: id })).statusCode).toBe(400)
    const missing = await open('POST', `/api/f/${code}`, {
      rating: 5,
      ticketId: '00000000-0000-7000-8000-000000000000',
    })
    expect(missing.statusCode).toBe(404)
  })
})

describe('kabinet', () => {
  it('egasi hammasini koʻradi, jamlanma toʻgʻri', async () => {
    const r = await owner()('GET', '/api/feedback?page=1&pageSize=50')
    expect(r.statusCode).toBe(200)
    const items = r.json().data.items
    expect(items.length).toBeGreaterThanOrEqual(3)
    const mine = items.find((f: { doctorId: string | null }) => f.doctorId === doctor.id)
    expect(mine.doctorName).toBe('Fikr Shifokori')
    expect(mine.phone).toBe('+998 90 123 45 67')

    const summary = (await owner()('GET', '/api/feedback/summary')).json().data
    expect(summary.count).toBe(r.json().data.total)
    expect(summary.newCount).toBeGreaterThan(0)
    expect(summary.average).toBeGreaterThan(0)
    expect(
      summary.byDoctor.find((d: { doctorId: string | null }) => d.doctorId === doctor.id).count,
    ).toBe(1)
  })

  it('filtrlar: faqat past baho, faqat yangi', async () => {
    const low = (await owner()('GET', '/api/feedback?low=true')).json().data.items
    expect(low.every((f: { rating: number }) => f.rating <= 2)).toBe(true)
    expect(low.length).toBeGreaterThanOrEqual(1)
    const fresh = (await owner()('GET', '/api/feedback?status=new')).json().data.items
    expect(fresh.every((f: { status: string }) => f.status === 'new')).toBe(true)
  })

  it('shifokor (feedback.own) faqat oʻzi haqidagini koʻradi', async () => {
    const r = await as(doctor.cookie)('GET', '/api/feedback?page=1&pageSize=50')
    expect(r.statusCode).toBe(200)
    const items = r.json().data.items
    expect(items.length).toBe(1)
    expect(items[0].doctorId).toBe(doctor.id)
    // Filtr bilan ham chiqa olmaydi
    const other = await as(doctor.cookie)('GET', `/api/feedback?doctorId=${h.userId}`)
    expect(
      other.json().data.items.every((f: { doctorId: string }) => f.doctorId === doctor.id),
    ).toBe(true)
    const summary = (await as(doctor.cookie)('GET', '/api/feedback/summary')).json().data
    expect(summary.count).toBe(1)
  })

  it('holat: egasi oʻzgartiradi, shifokor boshqanikini 404', async () => {
    const items = (await owner()('GET', '/api/feedback?page=1&pageSize=50')).json().data.items
    const ownersOne = items.find((f: { doctorId: string | null }) => f.doctorId === h.userId)
    const r = await owner()('PATCH', `/api/feedback/${ownersOne.id}`, { status: 'contacted' })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.status).toBe('contacted')

    const denied = await as(doctor.cookie)('PATCH', `/api/feedback/${ownersOne.id}`, {
      status: 'seen',
    })
    expect(denied.statusCode).toBe(404)
  })

  it('ruxsatsiz xodim 403', async () => {
    const roles = await h.ownerDb.role.findMany({ where: { clinicId: h.clinicId } })
    const role = roles.find((r) => r.template === 'texnik')
    const email = `fikr-texnik-${h.clinicId.slice(0, 8)}@sinov.uz`
    await owner()('POST', '/api/staff', {
      email,
      fullName: 'Fikr Texnigi',
      roleId: role?.id,
      password: 'juda-yaxshi-parol',
    })
    const login = await h.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      remoteAddress: h.clientIp,
      payload: { email, password: 'juda-yaxshi-parol' },
    })
    const cookie = `ed_session=${login.cookies.find((c) => c.name === 'ed_session')?.value}`
    expect((await as(cookie)('GET', '/api/feedback')).statusCode).toBe(403)
  })

  it('boshqa klinikaning fikrlari koʻrinmaydi', async () => {
    await h.ownerDb.feedback.create({
      data: { clinicId: otherClinicId, rating: 1, tags: [], source: 'qr', comment: 'B klinika' },
    })
    const items = (await owner()('GET', '/api/feedback?page=1&pageSize=100')).json().data.items
    expect(items.some((f: { comment: string | null }) => f.comment === 'B klinika')).toBe(false)
  })
})
