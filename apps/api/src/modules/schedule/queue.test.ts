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
// oʻz IP oraligʻini oladi — aks holda ketma-ket yugurishlar bir-birining
// qoldigʻiga urilib 429 olardi. Vaqtga bogʻlash yetarli emas: bir daqiqa
// ichida ikki marta ishga tushsa oraliq baribir bir xil boʻlardi
const IP_PREFIX = `10.${1 + Math.floor(Math.random() * 250)}`
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
    const ip = `${IP_PREFIX}.200.${1 + Math.floor(Math.random() * 250)}`
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

describe('kutish xonasi ekrani', () => {
  it('chaqirilgan raqam va keyingilari koʻrinadi', async () => {
    const tickets = []
    for (const name of ['Ekran Bir', 'Ekran Ikki', 'Ekran Uch', 'Ekran Toʻrt', 'Ekran Besh']) {
      const r = await open('POST', `/api/n/${code}/join`, { doctorId, fullName: name })
      tickets.push(r.json().data)
    }

    // Qabulxona birinchisini chaqirdi, qolganlari navbatda
    await h.ownerDb.appointment.update({
      where: { id: tickets[0]?.id },
      data: { queueStatus: 'called' },
    })
    for (const ticket of tickets.slice(1)) {
      await h.ownerDb.appointment.update({
        where: { id: ticket.id },
        data: { queueStatus: 'waiting' },
      })
    }

    const data = (await open('GET', `/api/n/${code}/screen`)).json().data
    expect(data.called).toEqual([{ number: tickets[0]?.number, doctorName: 'Sinov Egasi' }])

    // Faqat keyingi uchtasi — ekranga koʻproq sigʻmaydi. Kutayotganlar
    // bu testdan oldin ham boʻlishi mumkin, shuning uchun kutilgan
    // roʻyxatni bazadan olamiz
    const waiting = await h.ownerDb.appointment.findMany({
      where: { clinicId: h.clinicId, queueStatus: 'waiting' },
      select: { queueNumber: true },
      orderBy: { queueNumber: 'asc' },
      take: 3,
    })
    expect(data.next).toEqual(waiting.map((row) => row.queueNumber))
    expect(data.next).toHaveLength(3)
  })

  // Kutayotganlar bir-birining ismini bilmasligi kerak (tz.md 14-boʻlim)
  it('ekranda bemor ismlari yoʻq', async () => {
    const raw = (await open('GET', `/api/n/${code}/screen`)).payload
    expect(raw).not.toContain('Ekran Bir')
    expect(raw).not.toMatch(/guestName|guestPhone|patientId/)
  })

  it('tasdiqlanmagan yozuvlar ekranga chiqmaydi', async () => {
    const joined = (
      await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Tasdiqsiz Bemor' })
    ).json().data
    const data = (await open('GET', `/api/n/${code}/screen`)).json().data
    expect(data.next).not.toContain(joined.number)
  })

  it('navbat oʻchirilgan boʻlsa ekran ham yopiladi', async () => {
    await h.ownerDb.clinic.update({ where: { id: h.clinicId }, data: { queueEnabled: false } })
    expect((await open('GET', `/api/n/${code}/screen`)).statusCode).toBe(403)
    await h.ownerDb.clinic.update({ where: { id: h.clinicId }, data: { queueEnabled: true } })
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

  // Ochiq marshrut: bitta IP dan cheksiz oqim ushlab turishga yoʻl yoʻq
  it('bitta IP dan uchtadan koʻp oqim ochilmaydi', async () => {
    const controllers = [new AbortController(), new AbortController(), new AbortController()]
    const opened = await Promise.all(
      controllers.map((controller) =>
        fetch(`${origin}/api/n/${code}/stream`, { signal: controller.signal }),
      ),
    )
    expect(opened.map((response) => response.status)).toEqual([200, 200, 200])

    const fourth = await fetch(`${origin}/api/n/${code}/stream`)
    expect(fourth.status).toBe(429)

    for (const controller of controllers) controller.abort()
    // Ulanishlar yopilgach yana ochish mumkin
    await new Promise((resolve) => setTimeout(resolve, 200))
    const again = new AbortController()
    const response = await fetch(`${origin}/api/n/${code}/stream`, { signal: again.signal })
    expect(response.status).toBe(200)
    again.abort()
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

describe('kabinetdagi navbat', () => {
  it('roʻyxatda ismlar koʻrinadi', async () => {
    const joined = (
      await open('POST', `/api/n/${code}/join`, {
        doctorId,
        fullName: 'Kabinet Bemori',
        phone: '907778899',
      })
    ).json().data

    const rows = (await call('GET', '/api/queue')).json().data
    const mine = rows.find((row: { id: string }) => row.id === joined.id)
    expect(mine).toMatchObject({ fio: 'Kabinet Bemori', status: 'unconfirmed' })
    // Telefon kartotekadagi bilan bir xil koʻrinishda saqlanadi
    expect(mine.phone).toBe('+998907778899')
  })

  // Tasdiqlashda kartoteka bilan bogʻlanadi (tz.md 14-boʻlim)
  it('tasdiqlanganda yangi bemor ochiladi', async () => {
    const joined = (
      await open('POST', `/api/n/${code}/join`, {
        doctorId,
        fullName: 'Yangi Kartoteka',
        phone: '905554433',
      })
    ).json().data

    const before = await h.ownerDb.patient.count({ where: { clinicId: h.clinicId } })
    const rows = (await call('PATCH', `/api/queue/${joined.id}`, { action: 'confirm' })).json().data
    const after = await h.ownerDb.patient.count({ where: { clinicId: h.clinicId } })

    expect(after).toBe(before + 1)
    const mine = rows.find((row: { id: string }) => row.id === joined.id)
    expect(mine.status).toBe('waiting')
    expect(mine.patientId).not.toBeNull()
  })

  it('telefon kartotekada boʻlsa yangi bemor ochilmaydi', async () => {
    const patient = (
      await call('POST', '/api/patients', { fio: 'Eski Bemor', phone: '901010101' })
    ).json().data
    const joined = (
      await open('POST', `/api/n/${code}/join`, {
        doctorId,
        fullName: 'Boshqacha Yozilgan',
        phone: '901010101',
      })
    ).json().data

    const before = await h.ownerDb.patient.count({ where: { clinicId: h.clinicId } })
    const rows = (await call('PATCH', `/api/queue/${joined.id}`, { action: 'confirm' })).json().data
    const after = await h.ownerDb.patient.count({ where: { clinicId: h.clinicId } })

    expect(after).toBe(before)
    const mine = rows.find((row: { id: string }) => row.id === joined.id)
    expect(mine.patientId).toBe(patient.id)
    // Kartotekadagi ism ustun turadi
    expect(mine.fio).toBe('Eski Bemor')
  })

  it('bosqichlar: tasdiqlash → chaqirish → yakunlandi', async () => {
    const joined = (
      await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Bosqich Bemori' })
    ).json().data
    const statusOf = (rows: { id: string; status: string }[]) =>
      rows.find((row) => row.id === joined.id)?.status

    expect(
      statusOf((await call('PATCH', `/api/queue/${joined.id}`, { action: 'confirm' })).json().data),
    ).toBe('waiting')
    expect(
      statusOf((await call('PATCH', `/api/queue/${joined.id}`, { action: 'call' })).json().data),
    ).toBe('called')
    expect(
      statusOf((await call('PATCH', `/api/queue/${joined.id}`, { action: 'done' })).json().data),
    ).toBe('finished')

    const appointment = await h.ownerDb.appointment.findUnique({ where: { id: joined.id } })
    expect(appointment?.status).toBe('done')
  })

  it('bosqichni sakrab boʻlmaydi', async () => {
    const joined = (
      await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Sakrash Bemori' })
    ).json().data
    const r = await call('PATCH', `/api/queue/${joined.id}`, { action: 'done' })
    expect(r.statusCode).toBe(400)
  })

  it('kelmadi holati navbatdan chiqaradi', async () => {
    const joined = (
      await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Kelmagan Bemor' })
    ).json().data
    await call('PATCH', `/api/queue/${joined.id}`, { action: 'confirm' })
    const rows = (await call('PATCH', `/api/queue/${joined.id}`, { action: 'no_show' })).json().data

    expect(rows.find((row: { id: string }) => row.id === joined.id).status).toBe('finished')
    const appointment = await h.ownerDb.appointment.findUnique({ where: { id: joined.id } })
    expect(appointment?.status).toBe('no_show')
  })

  it('amal ochiq sahifalarga hodisa yuboradi', async () => {
    const joined = (
      await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Hodisa Bemori' })
    ).json().data

    let events = 0
    const stop = h.bus.subscribe(`queue:${h.clinicId}`, () => {
      events += 1
    })
    await call('PATCH', `/api/queue/${joined.id}`, { action: 'confirm' })
    stop()

    expect(events).toBe(1)
  })

  it('`queue.manage` yoʻq boʻlsa roʻyxat yopiq', async () => {
    const watcher = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'kuzatuvchi' },
    })
    const owner = await h.ownerDb.role.findFirst({ where: { clinicId: h.clinicId, isOwner: true } })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: watcher?.id } })
    expect((await call('GET', '/api/queue')).statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })

  it('ochiq marshrut orqali navbat holatini oʻzgartirib boʻlmaydi', async () => {
    const joined = (
      await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Ruxsatsiz Bemor' })
    ).json().data
    const r = await open('PATCH' as 'POST', `/api/queue/${joined.id}`, { action: 'confirm' })
    expect(r.statusCode).toBe(401)
  })
})

describe('suiisteʼmoldan himoya', () => {
  // Bitta brauzerdan kuniga ikkitadan koʻp yozib boʻlmaydi (tz.md 14-boʻlim)
  it('bitta qurilmadan kuniga ikkita yozuv', async () => {
    // Har soʻrovda boshqa IP, lekin bitta qurilma cookie si
    const first = await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Qurilma Bir' })
    const device = first.cookies.find((c) => c.name === 'ed_device')?.value
    expect(device).toBeTruthy()

    const withDevice = (name: string) =>
      h.app.inject({
        method: 'POST',
        url: `/api/n/${code}/join`,
        payload: { doctorId, fullName: name },
        remoteAddress: randomIp(),
        cookies: { ed_device: device as string },
      })

    expect((await withDevice('Qurilma Ikki')).statusCode).toBe(200)
    const third = await withDevice('Qurilma Uch')
    expect(third.statusCode).toBe(429)
    expect(third.json().error.message).toMatch(/juda koʻp/)
  })

  it('qurilma belgisi cookie da faqat bir marta beriladi', async () => {
    const first = await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Cookie Bir' })
    const device = first.cookies.find((c) => c.name === 'ed_device')?.value

    const second = await h.app.inject({
      method: 'POST',
      url: `/api/n/${code}/join`,
      payload: { doctorId, fullName: 'Cookie Ikki' },
      remoteAddress: randomIp(),
      cookies: { ed_device: device as string },
    })
    // Belgisi bor boʻlsa yangisi berilmaydi
    expect(second.cookies.find((c) => c.name === 'ed_device')).toBeUndefined()
  })

  it('navbatni oʻchirib qoʻyish mumkin va sahifa yopiladi', async () => {
    const off = await call('PATCH', '/api/clinic/queue', { enabled: false })
    expect(off.statusCode).toBe(200)
    expect(off.json().data.queueEnabled).toBe(false)

    expect((await open('GET', `/api/n/${code}`)).statusCode).toBe(403)
    expect(
      (await open('POST', `/api/n/${code}/join`, { doctorId, fullName: 'Yopiq Navbat' }))
        .statusCode,
    ).toBe(403)

    const on = await call('PATCH', '/api/clinic/queue', { enabled: true })
    expect(on.json().data.queueEnabled).toBe(true)
    expect((await open('GET', `/api/n/${code}`)).statusCode).toBe(200)
  })

  it('navbatni faqat sozlamalar ruxsati boriga oʻchirish mumkin', async () => {
    const reception = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'qabulxona' },
    })
    const owner = await h.ownerDb.role.findFirst({ where: { clinicId: h.clinicId, isOwner: true } })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: reception?.id } })
    // Qabulxonada `queue.manage` bor, lekin sozlamalarga tegmaydi
    expect((await call('GET', '/api/queue')).statusCode).toBe(200)
    expect((await call('PATCH', '/api/clinic/queue', { enabled: false })).statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })
})
