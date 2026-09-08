import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

let h: Harness
let code = ''
let doctorId = ''
let otherClinicId = ''

interface Doctor {
  id: string
  fullName: string
  waiting: number
  waitMinutes: number
}

function call(method: 'GET' | 'POST' | 'PATCH', url: string, payload?: object) {
  return h.app.inject({ method, url, payload, headers: { cookie: h.cookie } })
}

/// Ochiq sahifa: cookie yuborilmaydi va har soʻrov boshqa IP dan —
/// cheklovga urilib qolmaslik uchun
function open(method: 'GET' | 'POST', url: string, payload?: object, ip = randomIp()) {
  return h.app.inject({ method, url, payload, remoteAddress: ip })
}

// Cheklov hisoblagichi Redis da bir soat yashaydi. Har ishga tushirish
// oʻz IP oraligʻini oladi — aks holda ikkinchi yugurish birinchisining
// qoldigʻiga urilib 429 oladi
const IP_PREFIX = `10.${Math.floor(Date.now() / 60_000) % 250}`
let ipCounter = 0
function randomIp(): string {
  ipCounter += 1
  return `${IP_PREFIX}.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`
}

beforeAll(async () => {
  h = await startHarness()

  const clinic = await h.ownerDb.clinic.findUnique({ where: { id: h.clinicId } })
  code = clinic?.queueCode ?? ''

  // Egasi rolida `visits.write` bor — u ham qabul qiluvchi hisoblanadi
  doctorId = h.userId

  const other = await createOtherClinic(h.ownerDb)
  otherClinicId = other.id
}, 30_000)

afterAll(async () => {
  await removeClinic(h.ownerDb, otherClinicId)
  await h.stop()
})

describe('ochiq sahifa', () => {
  it('kod boʻyicha klinika va shifokorlar qaytadi', async () => {
    const r = await open('GET', `/api/n/${code}`)
    expect(r.statusCode).toBe(200)
    const data = r.json().data
    expect(data.clinicName).toContain('Sinov klinikasi')
    expect(data.doctors.map((d: Doctor) => d.id)).toContain(doctorId)
  })

  // Ochiq sahifa faqat uchta maydonni biladi: id, nom, navbat yoqilganmi
  it('klinikaning muddati va tarifi ochiq sahifaga chiqmaydi', async () => {
    const data = (await open('GET', `/api/n/${code}`)).json().data
    expect(JSON.stringify(data)).not.toMatch(/expiresAt|isTrial|plan/)
  })

  it('notoʻgʻri kod 404', async () => {
    expect((await open('GET', '/api/n/yoqbunday')).statusCode).toBe(404)
  })

  it('navbat oʻchirilgan boʻlsa 403', async () => {
    await h.ownerDb.clinic.update({ where: { id: h.clinicId }, data: { queueEnabled: false } })
    const r = await open('GET', `/api/n/${code}`)
    expect(r.statusCode).toBe(403)
    expect(r.json().error.message).toMatch(/yopilgan/)

    await h.ownerDb.clinic.update({ where: { id: h.clinicId }, data: { queueEnabled: true } })
  })

  it('bloklangan klinika kodi ishlamaydi', async () => {
    await h.ownerDb.clinic.update({ where: { id: h.clinicId }, data: { status: 'blocked' } })
    expect((await open('GET', `/api/n/${code}`)).statusCode).toBe(404)
    await h.ownerDb.clinic.update({ where: { id: h.clinicId }, data: { status: 'active' } })
  })
})

describe('navbatga yozilish', () => {
  it('raqam beriladi va yozuv tasdiqlanmagan boʻladi', async () => {
    const r = await open('POST', `/api/n/${code}/join`, {
      doctorId,
      fullName: 'Anvar Toshmatov',
      phone: '901112233',
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({ number: 1, ahead: 0, status: 'unconfirmed' })
  })

  it('raqamlar ketma-ket oshadi', async () => {
    const second = await open('POST', `/api/n/${code}/join`, {
      doctorId,
      fullName: 'Bobur Aliyev',
    })
    expect(second.json().data.number).toBe(2)
  })

  // Ochiq sahifa kartotekaga umuman tegmaydi: bogʻlash qabulxonada
  it('kartotekada yangi bemor yaratilmaydi', async () => {
    const before = await h.ownerDb.patient.count({ where: { clinicId: h.clinicId } })
    await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Dilshod Karimov' })
    const after = await h.ownerDb.patient.count({ where: { clinicId: h.clinicId } })
    expect(after).toBe(before)
  })

  it('ismsiz yozilib boʻlmaydi', async () => {
    const r = await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'A' })
    expect(r.statusCode).toBe(400)
  })

  it('begona shifokor bilan yozilib boʻlmaydi', async () => {
    const stranger = await h.ownerDb.user.create({
      data: { clinicId: otherClinicId, email: 'begona.shifokor@example.com', passwordHash: 'x' },
    })
    const r = await open('POST', `/api/n/${code}/join`, {
      doctorId: stranger.id,
      fullName: 'Begona Bemor',
    })
    expect(r.statusCode).toBe(404)
  })

  // Bir vaqtda kelgan soʻrovlar bitta raqamni olib qoʻymasligi kerak
  it('bir vaqtda yozilganlarga bir xil raqam tegmaydi', async () => {
    const results = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        open('POST', `/api/n/${code}/join`, { doctorId, fullName: `Bir Vaqtda ${index}` }),
      ),
    )
    const numbers = results.map((r) => r.json().data.number as number)
    expect(new Set(numbers).size).toBe(numbers.length)
  })

  it('bitta IP dan soatiga besh martadan koʻp yozib boʻlmaydi', async () => {
    const ip = `${IP_PREFIX}.200.${Date.now() % 250}`
    const codes: number[] = []
    for (let i = 0; i < 7; i++) {
      const r = await open('POST', `/api/n/${code}/join`, { doctorId, fullName: `Sinov ${i}` }, ip)
      codes.push(r.statusCode)
    }
    expect(codes.filter((status) => status === 200)).toHaveLength(5)
    expect(codes.at(-1)).toBe(429)
  })
})

describe('oʻz raqamini kuzatish', () => {
  it('yozuv holati va oldindagilar soni koʻrinadi', async () => {
    const joined = await open('POST', `/api/n/${code}/join`, {
      doctorId,
      fullName: 'Kuzatuvchi Bemor',
    })
    const ticket = joined.json().data

    const r = await open('GET', `/api/n/${code}/ticket/${ticket.id}`)
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({ number: ticket.number, status: 'unconfirmed' })
  })

  it('tasdiqlangan yozuvlar oldindagilar sonida koʻrinadi', async () => {
    const first = (
      await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Birinchi Navbat' })
    ).json().data
    const second = (
      await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Ikkinchi Navbat' })
    ).json().data

    // Qabulxona tasdiqlagandek qilamiz (kabinet amallari — 4.5)
    await h.ownerDb.appointment.update({
      where: { id: first.id },
      data: { queueStatus: 'waiting' },
    })

    const r = await open('GET', `/api/n/${code}/ticket/${second.id}`)
    expect(r.json().data.ahead).toBe(1)
    expect(r.json().data.waitMinutes).toBeGreaterThan(0)
  })

  it('begona yozuv id si bilan maʼlumot olinmaydi', async () => {
    const r = await open('GET', `/api/n/${code}/ticket/01a08000-0000-7000-8000-000000000000`)
    expect(r.statusCode).toBe(404)
  })

  it('oddiy qabul navbat yozuvi sifatida ochilmaydi', async () => {
    const patient = (await call('POST', '/api/patients', { fio: 'Jadval Bemori' })).json().data
    const appointment = (
      await call('POST', '/api/appointments', {
        patientId: patient.id,
        date: '2026-12-01',
        time: '10:00',
      })
    ).json().data

    const r = await open('GET', `/api/n/${code}/ticket/${appointment.id}`)
    expect(r.statusCode).toBe(404)
  })
})

describe('navbat sanogʻi', () => {
  it('kutayotganlar soni shifokor kartochkasida koʻrinadi', async () => {
    const board = (await open('GET', `/api/n/${code}`)).json().data
    const doctor = board.doctors.find((item: Doctor) => item.id === doctorId)
    // Yuqorida bittasi «waiting» ga oʻtkazilgan edi
    expect(doctor.waiting).toBe(1)
    expect(doctor.waitMinutes).toBeGreaterThan(0)
  })

  it('tasdiqlanmagan yozuvlar navbat sanogʻiga kirmaydi', async () => {
    const before = (await open('GET', `/api/n/${code}`))
      .json()
      .data.doctors.find((item: Doctor) => item.id === doctorId).waiting
    await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Yana Bir Bemor' })
    const after = (await open('GET', `/api/n/${code}`))
      .json()
      .data.doctors.find((item: Doctor) => item.id === doctorId).waiting
    expect(after).toBe(before)
  })
})

describe('jonli oqim', () => {
  // SSE javobi tugamaydi, shuning uchun inject ishlamaydi — haqiqiy
  // ulanish ochamiz
  let origin = ''

  beforeAll(async () => {
    await h.app.listen({ port: 0, host: '127.0.0.1' })
    const address = h.app.server.address()
    origin = typeof address === 'object' && address ? `http://127.0.0.1:${address.port}` : ''
  })

  it('SSE sarlavhalari bilan ochiladi va boshlangʻich hodisa yuboradi', async () => {
    const controller = new AbortController()
    const response = await fetch(`${origin}/api/n/${code}/stream`, { signal: controller.signal })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toMatch(/text\/event-stream/)
    expect(response.headers.get('cache-control')).toMatch(/no-cache/)
    // Proxy oqimni buferlab qoʻymasin
    expect(response.headers.get('x-accel-buffering')).toBe('no')

    const reader = (response.body as ReadableStream<Uint8Array>).getReader()
    const first = await reader.read()
    expect(new TextDecoder().decode(first.value)).toContain('event: ready')

    controller.abort()
  })

  it('yozilish oqimga «update» hodisasini yuboradi', async () => {
    const controller = new AbortController()
    const response = await fetch(`${origin}/api/n/${code}/stream`, { signal: controller.signal })
    const reader = (response.body as ReadableStream<Uint8Array>).getReader()
    await reader.read() // ready

    await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Oqim Bemori' })

    const next = await reader.read()
    expect(new TextDecoder().decode(next.value)).toContain('event: update')
    controller.abort()
  })

  it('notoʻgʻri kod bilan oqim ochilmaydi', async () => {
    const response = await fetch(`${origin}/api/n/yoqbunday/stream`)
    expect(response.status).toBe(404)
  })

  // Ulanish uzilganda obuna ham tozalanishi kerak — aks holda har ochilgan
  // sahifa xotirada qolib ketadi
  it('ulanish yopilganda obuna tozalanadi', async () => {
    const controller = new AbortController()
    const response = await fetch(`${origin}/api/n/${code}/stream`, { signal: controller.signal })
    const reader = (response.body as ReadableStream<Uint8Array>).getReader()
    await reader.read()
    controller.abort()

    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(h.bus.subscriberCount(`queue:${h.clinicId}`)).toBe(0)
  })
})
