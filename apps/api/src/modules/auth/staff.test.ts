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

async function addStaff(email: string, extra: Record<string, unknown> = {}) {
  return call('POST', '/api/staff', {
    email,
    fullName: 'Yangi Xodim',
    roleId: doctorRoleId,
    password: 'juda-yaxshi-parol',
    ...extra,
  })
}

async function loginAs(email: string, password: string) {
  const r = await h.app.inject({
    method: 'POST',
    url: '/api/auth/login',
    remoteAddress: h.clientIp,
    payload: { email, password },
  })
  return {
    status: r.statusCode,
    cookie: `ed_session=${r.cookies.find((c) => c.name === 'ed_session')?.value}`,
  }
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

describe('xodim qoʻshish', () => {
  it('egasi hisob ochadi va parolni oʻzi belgilaydi', async () => {
    const r = await addStaff('shifokor@example.com')
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({
      email: 'shifokor@example.com',
      fullName: 'Yangi Xodim',
      roleName: 'Shifokor',
      status: 'active',
    })

    // Hisob darhol ishlaydi: pochta tasdigʻi soʻralmaydi
    const login = await loginAs('shifokor@example.com', 'juda-yaxshi-parol')
    expect(login.status).toBe(200)
  })

  it('yangi xodim oʻz roli doirasida ishlaydi', async () => {
    const { cookie } = await loginAs('shifokor@example.com', 'juda-yaxshi-parol')

    const patients = await h.app.inject({
      method: 'GET',
      url: '/api/patients',
      headers: { cookie },
    })
    expect(patients.statusCode).toBe(200)
    // Shifokorda `staff.manage` yoʻq
    const staff = await h.app.inject({ method: 'GET', url: '/api/staff', headers: { cookie } })
    expect(staff.statusCode).toBe(403)
  })

  it('band pochta bilan hisob ochilmaydi', async () => {
    expect((await addStaff('shifokor@example.com')).statusCode).toBe(409)
    expect((await addStaff(h.email)).statusCode).toBe(409)
  })

  it('qisqa parol rad etiladi', async () => {
    const r = await addStaff('qisqa@example.com', { password: '123' })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.password).toBeTruthy()
  })

  it('yoʻq rol bilan hisob ochilmaydi', async () => {
    const r = await addStaff('boshqa@example.com', {
      roleId: '0195f7b7-0000-7000-8000-000000000000',
    })
    expect(r.statusCode).toBe(404)
  })

  it('roʻyxatda xodimlar rol nomi bilan koʻrinadi', async () => {
    const rows: StaffRow[] = (await call('GET', '/api/staff')).json().data
    expect(rows.find((row) => row.email === h.email)?.roleName).toBe('Egasi')
    expect(rows.find((row) => row.email === 'shifokor@example.com')?.roleName).toBe('Shifokor')
  })

  it('`staff.manage` yoʻq boʻlsa hisob ocha olmaydi', async () => {
    const { cookie } = await loginAs('shifokor@example.com', 'juda-yaxshi-parol')
    const r = await h.app.inject({
      method: 'POST',
      url: '/api/staff',
      headers: { cookie },
      payload: {
        email: 'ruxsatsiz@example.com',
        fullName: 'Ruxsatsiz Xodim',
        roleId: doctorRoleId,
        password: 'juda-yaxshi-parol',
      },
    })
    expect(r.statusCode).toBe(403)
  })
})

describe('parolni almashtirish', () => {
  const email = 'parol@example.com'

  beforeAll(async () => {
    await addStaff(email)
  })

  it('joriy parol notoʻgʻri boʻlsa almashtirilmaydi', async () => {
    const { cookie } = await loginAs(email, 'juda-yaxshi-parol')
    const r = await h.app.inject({
      method: 'POST',
      url: '/api/me/password',
      headers: { cookie },
      payload: { currentPassword: 'boshqa-parol', newPassword: 'yangi-yaxshi-parol' },
    })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.message).toMatch(/Joriy parol/)
  })

  it('eski parolni qayta qoʻyib boʻlmaydi', async () => {
    const { cookie } = await loginAs(email, 'juda-yaxshi-parol')
    const r = await h.app.inject({
      method: 'POST',
      url: '/api/me/password',
      headers: { cookie },
      payload: { currentPassword: 'juda-yaxshi-parol', newPassword: 'juda-yaxshi-parol' },
    })
    expect(r.statusCode).toBe(400)
  })

  it('almashtirilgach eski parol ishlamaydi', async () => {
    const { cookie } = await loginAs(email, 'juda-yaxshi-parol')
    const changed = await h.app.inject({
      method: 'POST',
      url: '/api/me/password',
      headers: { cookie },
      payload: { currentPassword: 'juda-yaxshi-parol', newPassword: 'yangi-yaxshi-parol' },
    })
    expect(changed.statusCode).toBe(200)

    expect((await loginAs(email, 'juda-yaxshi-parol')).status).toBe(401)
    expect((await loginAs(email, 'yangi-yaxshi-parol')).status).toBe(200)
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
    await addStaff('ega2@example.com', { roleId: ownerRoleId, fullName: 'Ikkinchi Ega' })
    const second = await h.ownerDb.user.findFirst({ where: { email: 'ega2@example.com' } })

    const demote = await h.app.inject({
      method: 'PATCH',
      url: `/api/staff/${second?.id}`,
      headers: { cookie: h.cookie },
      payload: { roleId: doctorRoleId },
    })
    expect(demote.statusCode).toBe(200)
  })

  // Bu yerda amalni egasi emas, `staff.manage` berilgan boshqa xodim bajaradi —
  // aks holda tekshiruvni «oʻzini oʻzgartira olmaydi» qoidasi yopib qoʻyadi
  it('oxirgi faol egani boshqa xodim ham tushira olmaydi', async () => {
    await call('PATCH', `/api/roles/${doctorRoleId}`, {
      permissions: ['patients.read', 'staff.manage'],
    })
    const { cookie: doctorCookie } = await loginAs('shifokor@example.com', 'juda-yaxshi-parol')

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

    // Egasini vaqtincha shifokor roliga oʻtkazamiz — yangi ruxsatlar
    // darhol kuchga kirishini shu koʻrsatadi
    const owner = await h.ownerDb.role.findFirst({ where: { clinicId: h.clinicId, isOwner: true } })
    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: doctorRoleId } })

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
    const target = await h.ownerDb.user.findFirst({ where: { email: 'shifokor@example.com' } })
    expect(
      (await call('PATCH', `/api/staff/${target?.id}`, { status: 'disabled' })).statusCode,
    ).toBe(200)

    expect((await loginAs('shifokor@example.com', 'juda-yaxshi-parol')).status).toBe(403)
  })

  it('roʻyxatda rol nomi va holat koʻrinadi', async () => {
    const rows: StaffRow[] = (await call('GET', '/api/staff')).json().data
    expect(rows.find((row) => row.email === 'shifokor@example.com')?.status).toBe('disabled')
    expect(rows.find((row) => row.email === h.email)?.roleName).toBe('Egasi')
  })
})
