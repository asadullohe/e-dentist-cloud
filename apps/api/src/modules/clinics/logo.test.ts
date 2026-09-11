// Klinika logotipi (6.4).
//
// Rasm imzolangan havola bilan emas, API orqali beriladi: serverda MinIO
// Docker tarmogʻi ichida va brauzer uning manzilini topa olmaydi.
// Manzilda klinika raqami emas, navbat kodi — sahifa loginsiz ochiladi.

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Harness, startHarness } from '../../test-support/harness.js'

let h: Harness
let queueCode = ''

/// Eng kichik haqiqiy PNG — 1×1 piksel
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

beforeAll(async () => {
  h = await startHarness()
  const clinic = await h.ownerDb.clinic.findUnique({ where: { id: h.clinicId } })
  queueCode = clinic?.queueCode ?? ''
}, 30_000)

afterAll(async () => {
  await h.stop()
})

function upload(body: Buffer, type: string, filename = 'logo.png', cookie = h.cookie) {
  const boundary = '----edentist'
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${type}\r\n\r\n`,
  )
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
  return h.app.inject({
    method: 'POST',
    url: '/api/clinic/logo',
    headers: { cookie, 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload: Buffer.concat([head, body, tail]),
  })
}

const fetchLogo = (code: string) => h.app.inject({ method: 'GET', url: `/api/n/${code}/logo` })

describe('logotip yuklash', () => {
  it('logotipi yoʻq klinikada rasm ham yoʻq', async () => {
    expect((await fetchLogo(queueCode)).statusCode).toBe(404)
  })

  it('yuklanadi va oʻsha rasmning oʻzi qaytadi', async () => {
    const uploaded = await upload(PNG, 'image/png')
    expect(uploaded.statusCode).toBe(200)
    expect(uploaded.json().data).toEqual({ hasLogo: true })

    const shown = await fetchLogo(queueCode)
    expect(shown.statusCode).toBe(200)
    expect(shown.headers['content-type']).toBe('image/png')
    expect(shown.rawPayload.equals(PNG)).toBe(true)
  })

  it('kabinet javobida logotip belgisi koʻrinadi', async () => {
    const me = await h.app.inject({ method: 'GET', url: '/api/me', headers: { cookie: h.cookie } })
    expect(me.json().data.clinic.logoKey).toBeTruthy()
  })

  it('rasm boʻlmagan fayl rad etiladi', async () => {
    const r = await upload(Buffer.from('men rasm emasman'), 'text/plain', 'x.txt')
    expect(r.statusCode).toBe(400)
  })

  it('juda katta fayl rad etiladi', async () => {
    // 2 MB dan katta: chegara xizmat qatlamida
    const r = await upload(Buffer.alloc(3 * 1024 * 1024, 1), 'image/png')
    expect(r.statusCode).toBe(400)
  })

  it('loginsiz yuklab boʻlmaydi', async () => {
    const r = await upload(PNG, 'image/png', 'logo.png', '')
    expect(r.statusCode).toBe(401)
  })
})

describe('logotipni oʻchirish', () => {
  it('oʻchirilgach rasm berilmaydi', async () => {
    await upload(PNG, 'image/png')

    const removed = await h.app.inject({
      method: 'DELETE',
      url: '/api/clinic/logo',
      headers: { cookie: h.cookie },
    })
    expect(removed.statusCode).toBe(200)
    expect(removed.json().data).toEqual({ hasLogo: false })

    expect((await fetchLogo(queueCode)).statusCode).toBe(404)
  })
})

describe('koʻp ijarachilik', () => {
  it('boshqa klinikaning kodida bu logotip koʻrinmaydi', async () => {
    await upload(PNG, 'image/png')

    // Mavjud boʻlmagan kod — hech qanday rasm bermaydi
    expect((await fetchLogo('yoqkod1')).statusCode).toBe(404)

    // Va oʻz kodimizda baribir bor
    expect((await fetchLogo(queueCode)).statusCode).toBe(200)
  })
})
