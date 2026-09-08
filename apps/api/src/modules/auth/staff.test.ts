import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Harness, startHarness } from '../../test-support/harness.js'

let h: Harness
let doctorRoleId = ''
let ownerRoleId = ''

interface StaffRow {
  id: string
  email: string
  fullName: string | null
  roleName: string | null
  status: 'active' | 'disabled'
}

function call(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) {
  return h.app.inject({
    method,
    url,
    payload,
    headers: { cookie: h.cookie },
    remoteAddress: h.clientIp,
  })
}

/// Xatdagi havoladan kalitni olamiz — kalit bazada saqlanmaydi
function lastToken(): string {
  return /token=([\w-]+)/.exec(h.sentMail.at(-1)?.body ?? '')?.[1] ?? ''
}

async function invite(email: string, roleId = doctorRoleId) {
  return call('POST', '/api/staff/invite', { email, roleId })
}

beforeAll(async () => {
  h = await startHarness()

  const roles = (await call('GET', '/api/roles')).json().data as {
    id: string
    template: string
    isOwner: boolean
  }[]
  doctorRoleId = roles.find((role) => role.template === 'shifokor')?.id ?? ''
  ownerRoleId = roles.find((role) => role.isOwner)?.id ?? ''
}, 30_000)

afterAll(async () => {
  await h.stop()
})

describe('taklifnoma', () => {
  it('yuboriladi va xatda havola boʻladi', async () => {
    const r = await invite('shifokor@example.com')
    expect(r.statusCode).toBe(200)
    expect(h.sentMail.at(-1)?.to).toBe('shifokor@example.com')
    expect(lastToken().length).toBeGreaterThan(20)
  })

  // Kalit bazada emas, faqat xeshi: baza sizib chiqsa ham havola tiklanmaydi
  it('kalitning oʻzi bazada saqlanmaydi', async () => {
    const token = lastToken()
    const rows = await h.ownerDb.invite.findMany({ where: { clinicId: h.clinicId } })
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.some((row) => row.tokenHash === token)).toBe(false)
  })

  it('kutilayotgan taklifnoma roʻyxatda koʻrinadi', async () => {
    const data = (await call('GET', '/api/staff')).json().data
    expect(data.invites.map((i: { email: string }) => i.email)).toContain('shifokor@example.com')
  })

  it('bitta pochtaga ikkinchi taklifnoma yuborilmaydi', async () => {
    const r = await invite('shifokor@example.com')
    expect(r.statusCode).toBe(409)
  })

  it('hisobi bor pochtaga taklifnoma yuborilmaydi', async () => {
    const r = await invite(h.email)
    expect(r.statusCode).toBe(409)
  })

  it('yoʻq rol bilan yuborilmaydi', async () => {
    const r = await invite('boshqa@example.com', '0195f7b7-0000-7000-8000-000000000000')
    expect(r.statusCode).toBe(404)
  })
})

describe('havola', () => {
  it('maʼlumot beradi: klinika va rol', async () => {
    const token = lastToken()
    await invite('havola@example.com')
    const r = await h.app.inject({ method: 'GET', url: `/api/invites/${lastToken()}` })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({ email: 'havola@example.com', roleName: 'Shifokor' })
    expect(token).not.toBe(lastToken())
  })

  it('notoʻgʻri kalit 404', async () => {
    const r = await h.app.inject({ method: 'GET', url: '/api/invites/yoq-bunday-kalit' })
    expect(r.statusCode).toBe(404)
  })

  it('muddati oʻtgan havola ishlamaydi', async () => {
    await invite('eski@example.com')
    const token = lastToken()
    await h.ownerDb.invite.updateMany({
      where: { email: 'eski@example.com' },
      data: { expiresAt: new Date('2020-01-01') },
    })

    const info = await h.app.inject({ method: 'GET', url: `/api/invites/${token}` })
    expect(info.statusCode).toBe(400)

    const accept = await h.app.inject({
      method: 'POST',
      url: '/api/invites/accept',
      remoteAddress: h.clientIp,
      payload: { token, fullName: 'Eski Xodim', password: 'juda-yaxshi-parol' },
    })
    expect(accept.statusCode).toBe(400)
  })
})

describe('hisob ochish', () => {
  it('parol qoʻyiladi, hisob faol boʻladi va sessiya beriladi', async () => {
    await invite('yangi@example.com')
    const token = lastToken()

    const r = await h.app.inject({
      method: 'POST',
      url: '/api/invites/accept',
      remoteAddress: h.clientIp,
      payload: { token, fullName: 'Yangi Shifokor', password: 'juda-yaxshi-parol' },
    })
    expect(r.statusCode).toBe(200)
    expect(r.cookies.find((c) => c.name === 'ed_session')?.value).toBeTruthy()

    const created = await h.ownerDb.user.findFirst({ where: { email: 'yangi@example.com' } })
    expect(created?.clinicId).toBe(h.clinicId)
    expect(created?.status).toBe('active')
    // Havola pochta egaligini isbotladi — qayta tasdiqlash soʻralmaydi
    expect(created?.emailVerifiedAt).not.toBeNull()
  })

  it('bitta havola ikki marta ishlamaydi', async () => {
    await invite('bir-marta@example.com')
    const token = lastToken()
    const payload = { token, fullName: 'Bir Marta', password: 'juda-yaxshi-parol' }

    const first = await h.app.inject({
      method: 'POST',
      url: '/api/invites/accept',
      remoteAddress: h.clientIp,
      payload,
    })
    expect(first.statusCode).toBe(200)

    const second = await h.app.inject({
      method: 'POST',
      url: '/api/invites/accept',
      remoteAddress: h.clientIp,
      payload,
    })
    expect(second.statusCode).toBe(400)
  })

  it('yangi xodim oʻz roli doirasida ishlaydi', async () => {
    await invite('ruxsat@example.com')
    const token = lastToken()
    const accepted = await h.app.inject({
      method: 'POST',
      url: '/api/invites/accept',
      remoteAddress: h.clientIp,
      payload: { token, fullName: 'Ruxsat Shifokor', password: 'juda-yaxshi-parol' },
    })
    const cookie = `ed_session=${accepted.cookies.find((c) => c.name === 'ed_session')?.value}`

    const patients = await h.app.inject({
      method: 'GET',
      url: '/api/patients',
      headers: { cookie },
    })
    expect(patients.statusCode).toBe(200)
    // Shifokorda staff.manage yoʻq
    const staff = await h.app.inject({ method: 'GET', url: '/api/staff', headers: { cookie } })
    expect(staff.statusCode).toBe(403)
  })

  it('taklifnoma bekor qilinsa havola ishlamaydi', async () => {
    await invite('bekor@example.com')
    const token = lastToken()
    const list = (await call('GET', '/api/staff')).json().data
    const pending = list.invites.find((i: { email: string }) => i.email === 'bekor@example.com')

    expect((await call('DELETE', `/api/staff/invites/${pending.id}`)).statusCode).toBe(200)
    const r = await h.app.inject({ method: 'GET', url: `/api/invites/${token}` })
    expect(r.statusCode).toBe(404)
  })
})

describe('qulflanib qolishdan himoya', () => {
  it('oʻz rolini oʻzgartira olmaydi', async () => {
    const r = await call('PATCH', `/api/staff/${h.userId}`, { roleId: doctorRoleId })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.message).toMatch(/Oʻz rolingizni/)
  })

  it('oʻzini faolsizlantira olmaydi', async () => {
    const r = await call('PATCH', `/api/staff/${h.userId}`, { status: 'disabled' })
    expect(r.statusCode).toBe(400)
  })

  it('ikkita ega boʻlsa birini egalikdan chiqarish mumkin', async () => {
    await invite('ega2@example.com', ownerRoleId)
    const accepted = await h.app.inject({
      method: 'POST',
      url: '/api/invites/accept',
      remoteAddress: h.clientIp,
      payload: { token: lastToken(), fullName: 'Ikkinchi Ega', password: 'juda-yaxshi-parol' },
    })
    const secondCookie = `ed_session=${accepted.cookies.find((c) => c.name === 'ed_session')?.value}`
    const second = await h.ownerDb.user.findFirst({ where: { email: 'ega2@example.com' } })

    const demote = await h.app.inject({
      method: 'PATCH',
      url: `/api/staff/${second?.id}`,
      headers: { cookie: h.cookie },
      payload: { roleId: doctorRoleId },
    })
    expect(demote.statusCode).toBe(200)
    expect(secondCookie.length).toBeGreaterThan(12)
  })

  // Bu yerda amalni egasi emas, `staff.manage` berilgan boshqa xodim bajaradi —
  // aks holda tekshiruvni «oʻzini oʻzgartira olmaydi» qoidasi yopib qoʻyadi
  it('oxirgi faol egani boshqa xodim ham tushira olmaydi', async () => {
    await call('PATCH', `/api/roles/${doctorRoleId}`, {
      permissions: ['patients.read', 'staff.manage'],
    })
    const doctor = await h.ownerDb.user.findFirst({ where: { email: 'ruxsat@example.com' } })
    const login = await h.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      remoteAddress: h.clientIp,
      payload: { email: 'ruxsat@example.com', password: 'juda-yaxshi-parol' },
    })
    const doctorCookie = `ed_session=${login.cookies.find((c) => c.name === 'ed_session')?.value}`
    expect(doctor?.id).toBeTruthy()

    for (const payload of [{ status: 'disabled' }, { roleId: doctorRoleId }]) {
      const r = await h.app.inject({
        method: 'PATCH',
        url: `/api/staff/${h.userId}`,
        headers: { cookie: doctorCookie },
        payload,
      })
      expect(r.statusCode, JSON.stringify(payload)).toBe(400)
      expect(r.json().error.message).toMatch(/kamida bitta faol egasi/)
    }

    // Egasi hamon faol va oʻz rolida
    const owner = await h.ownerDb.user.findUnique({ where: { id: h.userId } })
    expect(owner?.status).toBe('active')
    expect(owner?.roleId).toBe(ownerRoleId)

    await call('PATCH', `/api/roles/${doctorRoleId}`, {
      permissions: ['patients.read', 'patients.write', 'visits.write', 'teeth.write'],
    })
  })

  it('egasi roli staff.manage ruxsatini yoʻqota olmaydi', async () => {
    const r = await call('PATCH', `/api/roles/${ownerRoleId}`, {
      permissions: ['patients.read', 'billing.manage'],
    })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.message).toMatch(/kira olmay qoladi/)
  })

  it('boshqa rolning ruxsatlari oʻzgaradi va darhol kuchga kiradi', async () => {
    const r = await call('PATCH', `/api/roles/${doctorRoleId}`, {
      permissions: ['patients.read', 'visits.write', 'expenses.read'],
    })
    expect(r.statusCode).toBe(200)

    const doctor = await h.ownerDb.user.findFirst({ where: { email: 'ruxsat@example.com' } })
    const owner = await h.ownerDb.role.findFirst({ where: { clinicId: h.clinicId, isOwner: true } })
    await h.ownerDb.user.update({
      where: { id: h.userId },
      data: { roleId: doctor ? doctorRoleId : owner?.id },
    })

    // Egasi endi shifokor roli bilan: xarajat ochiq, xodimlar yopiq
    expect((await call('GET', '/api/expenses?month=2026-03')).statusCode).toBe(200)
    expect((await call('GET', '/api/staff')).statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
    await call('PATCH', `/api/roles/${doctorRoleId}`, {
      permissions: [
        'patients.read',
        'patients.write',
        'visits.write',
        'teeth.write',
        'schedule.write',
        'lab.write',
      ],
    })
  })

  it('notoʻgʻri ruxsat nomi rad etiladi', async () => {
    const r = await call('PATCH', `/api/roles/${doctorRoleId}`, {
      permissions: ['kosmosga.uchish'],
    })
    expect(r.statusCode).toBe(400)
  })
})

describe('xodim holati', () => {
  it('faolsizlantirilgan xodim kira olmaydi', async () => {
    const target = await h.ownerDb.user.findFirst({ where: { email: 'yangi@example.com' } })
    expect(
      (await call('PATCH', `/api/staff/${target?.id}`, { status: 'disabled' })).statusCode,
    ).toBe(200)

    const login = await h.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      remoteAddress: h.clientIp,
      payload: { email: 'yangi@example.com', password: 'juda-yaxshi-parol' },
    })
    expect(login.statusCode).toBe(403)
  })

  it('roʻyxatda rol nomi va holat koʻrinadi', async () => {
    const data = (await call('GET', '/api/staff')).json().data
    const rows: StaffRow[] = data.staff
    const disabled = rows.find((row) => row.email === 'yangi@example.com')
    expect(disabled?.status).toBe('disabled')
    expect(rows.find((row) => row.email === h.email)?.roleName).toBe('Egasi')
  })
})
