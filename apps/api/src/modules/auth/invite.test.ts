// Panelidan klinika ochish va taklifnoma orqali parol qoʻyish (6.1).
//
// Eng muhimi: parol hech qachon panel tomonidan belgilanmaydi va
// taklifnoma faqat oʻz klinikasiga hisob ocha oladi.

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { hashPassword } from '../../platform/password.js'
import { uuidV7 } from '../../platform/uuid.js'
import { type Harness, removeClinic, startHarness } from '../../test-support/harness.js'

let h: Harness
let adminCookie = ''
let adminId = ''
const adminEmail = `taklif-admin-${Date.now()}@example.com`
const ADMIN_PASSWORD = 'juda-yaxshi-admin-paroli'
const OWNER_PASSWORD = 'yangi-egasining-paroli'

/// Test tugagach tozalanadi
const createdClinics: string[] = []

beforeAll(async () => {
  h = await startHarness()

  adminId = uuidV7()
  await h.ownerDb.user.create({
    data: {
      id: adminId,
      email: adminEmail,
      passwordHash: await hashPassword(ADMIN_PASSWORD),
      fullName: 'Taklif Admini',
      emailVerifiedAt: new Date(),
    },
  })

  const login = await h.app.inject({
    method: 'POST',
    url: '/api/auth/login',
    remoteAddress: h.clientIp,
    payload: { email: adminEmail, password: ADMIN_PASSWORD },
  })
  adminCookie = `ed_session=${login.cookies.find((c) => c.name === 'ed_session')?.value}`
}, 30_000)

afterAll(async () => {
  for (const id of createdClinics) await removeClinic(h.ownerDb, id)
  await h.ownerDb.user.delete({ where: { id: adminId } })
  await h.stop()
})

interface ClinicCard {
  id: string
  name: string
  staffCount: number
  pendingInvite: { email: string; sentAt: string; expiresAt: string } | null
}

async function createClinic(email: string, name = `Panel klinikasi ${Date.now()}`) {
  const res = await h.app.inject({
    method: 'POST',
    url: '/api/admin/clinics',
    headers: { cookie: adminCookie },
    payload: { name, email, trialDays: 14 },
  })
  if (res.statusCode === 200) {
    const card = res.json().data as ClinicCard
    createdClinics.push(card.id)
    return { res, card }
  }
  return { res, card: null }
}

/// Xatdagi havoladan kalitni ajratib olamiz — foydalanuvchi ham shuni qiladi
function tokenFor(email: string): string {
  const mail = [...h.sentMail].reverse().find((m) => m.to === email)
  const match = mail?.body.match(/taklif\?token=([\w-]+)/)
  if (!match) throw new Error(`${email} uchun taklifnoma xati topilmadi`)
  return match[1] as string
}

function accept(token: string, fullName = 'Yangi Egasi', password = OWNER_PASSWORD) {
  return h.app.inject({
    method: 'POST',
    url: '/api/auth/invite',
    remoteAddress: h.clientIp,
    payload: { token, fullName, password },
  })
}

describe('panelidan klinika ochish', () => {
  it('klinika, beshta rol va taklifnoma yaratadi', async () => {
    const email = `egasi-${Date.now()}@example.com`
    const { res, card } = await createClinic(email)

    expect(res.statusCode).toBe(200)
    expect(card?.pendingInvite?.email).toBe(email)
    // Hali hech kim kirmagan: hisob taklifnoma qabul qilinganda yaratiladi
    expect(card?.staffCount).toBe(0)

    const roles = await h.ownerDb.role.count({ where: { clinicId: card?.id } })
    expect(roles).toBe(5)

    const mail = [...h.sentMail].reverse().find((m) => m.to === email)
    expect(mail?.body).toContain('/taklif?token=')
  })

  it('band pochtaga klinika ochmaydi va boʻsh klinika qoldirmaydi', async () => {
    const before = await h.ownerDb.clinic.count()

    const { res } = await createClinic(h.email)

    expect(res.statusCode).toBe(409)
    expect(await h.ownerDb.clinic.count()).toBe(before)
  })

  it('admin boʻlmagan hisob klinika ocholmaydi', async () => {
    const res = await h.app.inject({
      method: 'POST',
      url: '/api/admin/clinics',
      headers: { cookie: h.cookie },
      payload: { name: 'Ruxsatsiz', email: `ruxsatsiz-${Date.now()}@example.com` },
    })

    // Kirgan, lekin platforma admini emas — 403
    expect(res.statusCode).toBe(403)
  })
})

describe('taklifnomani qabul qilish', () => {
  it('havola klinika nomini koʻrsatadi', async () => {
    const email = `korish-${Date.now()}@example.com`
    const { card } = await createClinic(email, 'Koʻrish klinikasi')

    const res = await h.app.inject({ method: 'GET', url: `/api/auth/invite/${tokenFor(email)}` })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ clinicName: 'Koʻrish klinikasi', email })
    expect(card?.id).toBeTruthy()
  })

  it('parolni egasi qoʻyadi va darhol kabinetga kiradi', async () => {
    const email = `qabul-${Date.now()}@example.com`
    const { card } = await createClinic(email)

    const accepted = await accept(tokenFor(email))
    expect(accepted.statusCode).toBe(200)

    const cookie = `ed_session=${accepted.cookies.find((c) => c.name === 'ed_session')?.value}`
    const me = await h.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })
    expect(me.statusCode).toBe(200)
    expect(me.json().data.clinic.id).toBe(card?.id)

    // Hisob aynan oʻsha klinikada va egasi roli bilan yaratilgan
    const user = await h.ownerDb.user.findUnique({ where: { email } })
    expect(user?.clinicId).toBe(card?.id)
    const role = await h.ownerDb.role.findUnique({ where: { id: user?.roleId ?? '' } })
    expect(role?.template).toBe('egasi')

    // Panel endi «taklif yuborilgan» demaydi
    const cardAfter = await h.app.inject({
      method: 'GET',
      url: `/api/admin/clinics/${card?.id}`,
      headers: { cookie: adminCookie },
    })
    expect((cardAfter.json().data as ClinicCard).pendingInvite).toBeNull()
    expect((cardAfter.json().data as ClinicCard).staffCount).toBe(1)
  })

  it('qoʻyilgan parol bilan kira oladi', async () => {
    const email = `kirish-${Date.now()}@example.com`
    await createClinic(email)
    await accept(tokenFor(email))

    const login = await h.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      remoteAddress: h.clientIp,
      payload: { email, password: OWNER_PASSWORD },
    })

    expect(login.statusCode).toBe(200)
  })

  it('bir havola ikki marta ishlamaydi', async () => {
    const email = `takror-${Date.now()}@example.com`
    await createClinic(email)
    const token = tokenFor(email)

    expect((await accept(token)).statusCode).toBe(200)
    const again = await accept(token, 'Ikkinchi Urinish', 'boshqa-parol-123')

    expect(again.statusCode).toBe(400)
    expect(await h.ownerDb.user.count({ where: { email } })).toBe(1)
  })

  it('muddati oʻtgan havola ishlamaydi', async () => {
    const email = `eskirgan-${Date.now()}@example.com`
    const { card } = await createClinic(email)
    const token = tokenFor(email)

    await h.ownerDb.invite.updateMany({
      where: { clinicId: card?.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    })

    const res = await accept(token)

    expect(res.statusCode).toBe(400)
    expect(await h.ownerDb.user.count({ where: { email } })).toBe(0)
  })

  it('oʻylab topilgan kalit ishlamaydi', async () => {
    const res = await accept('bunday-kalit-umuman-yoq-12345678')
    expect(res.statusCode).toBe(400)
  })
})

describe('taklifnomani qayta yuborish', () => {
  it('yangi havola ishlaydi, eskisi ishlamay qoladi', async () => {
    const email = `qayta-${Date.now()}@example.com`
    const { card } = await createClinic(email)
    const oldToken = tokenFor(email)

    const resent = await h.app.inject({
      method: 'POST',
      url: `/api/admin/clinics/${card?.id}/invite`,
      headers: { cookie: adminCookie },
    })
    expect(resent.statusCode).toBe(200)

    const newToken = tokenFor(email)
    expect(newToken).not.toBe(oldToken)

    // Eski havola oʻchirilgan: pochtada bir vaqtda ikkita amal qiluvchi
    // havola yotib qolmasligi kerak
    expect((await accept(oldToken)).statusCode).toBe(400)
    expect((await accept(newToken)).statusCode).toBe(200)
  })

  it('taklifnomasi yoʻq klinikaga qayta yuborilmaydi', async () => {
    const res = await h.app.inject({
      method: 'POST',
      url: `/api/admin/clinics/${h.clinicId}/invite`,
      headers: { cookie: adminCookie },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('koʻp ijarachilik', () => {
  it('taklifnoma faqat oʻz klinikasiga hisob ochadi', async () => {
    const emailA = `a-${Date.now()}@example.com`
    const emailB = `b-${Date.now()}@example.com`
    const { card: cardA } = await createClinic(emailA, 'A klinikasi')
    const { card: cardB } = await createClinic(emailB, 'B klinikasi')

    await accept(tokenFor(emailB), 'B Egasi')

    const userB = await h.ownerDb.user.findUnique({ where: { email: emailB } })
    expect(userB?.clinicId).toBe(cardB?.id)
    // A klinikasida hech kim paydo boʻlmadi
    expect(await h.ownerDb.user.count({ where: { clinicId: cardA?.id } })).toBe(0)
  })
})
