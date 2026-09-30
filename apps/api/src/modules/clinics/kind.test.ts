// Klinika ↔ individual (tz.md 20-boʻlim): individual oʻzi klinikaga oʻtadi,
// teskarisi — faqat panel va faqat egasi va assistentlar qolgan boʻlsa

import type { RoleTemplate } from '@e-dentist/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { hashPassword } from '../../platform/password.js'
import { uuidV7 } from '../../platform/uuid.js'
import { type Harness, startHarness } from '../../test-support/harness.js'

function client(h: Harness, cookie = h.cookie) {
  return (method: 'GET' | 'POST' | 'PATCH', url: string, payload?: object) =>
    h.app.inject({ method, url, payload, headers: { cookie }, remoteAddress: h.clientIp })
}

async function roleId(h: Harness, template: RoleTemplate): Promise<string> {
  const role = await h.ownerDb.role.findFirst({ where: { clinicId: h.clinicId, template } })
  return role?.id ?? ''
}

async function addStaff(h: Harness, template: RoleTemplate, extra: object = {}) {
  const email = `${template}-${uuidV7().slice(-8)}@example.com`
  const r = await client(h)('POST', '/api/staff', {
    email,
    fullName: `Xodim ${template}`,
    roleId: await roleId(h, template),
    password: 'juda-yaxshi-parol',
    ...extra,
  })
  if (r.statusCode !== 200) throw new Error(`staff: ${r.body}`)
  return { id: r.json().data.id as string, email }
}

async function login(h: Harness, email: string, password = 'juda-yaxshi-parol') {
  const r = await h.app.inject({
    method: 'POST',
    url: '/api/auth/login',
    remoteAddress: h.clientIp,
    payload: { email, password },
  })
  return `ed_session=${r.cookies.find((c) => c.name === 'ed_session')?.value}`
}

describe('individual → klinika (kabinetdan)', () => {
  let h: Harness

  beforeAll(async () => {
    h = await startHarness({ kind: 'solo' })
  }, 30_000)

  afterAll(async () => {
    await h.stop()
  })

  it('assistent oʻtkaza olmaydi — bu egasining ishi', async () => {
    const assistant = await addStaff(h, 'assistent')
    const r = await client(h, await login(h, assistant.email))('POST', '/api/clinic/upgrade')
    expect(r.statusCode).toBe(403)
  })

  it('egasi oʻtkazadi, platforma egasiga xabar ketadi', async () => {
    const before = h.notify.sent.length
    const r = await client(h)('POST', '/api/clinic/upgrade')
    expect(r.statusCode).toBe(200)

    const me = await client(h)('GET', '/api/me')
    expect(me.json().data.clinic.kind).toBe('clinic')
    expect(h.notify.sent.length).toBe(before + 1)
    expect(h.notify.sent.at(-1)).toContain('klinikaga oʻtdi')
  })

  it('takror bosilsa hech narsa oʻzgarmaydi — ikkinchi xabar yoʻq', async () => {
    const before = h.notify.sent.length
    expect((await client(h)('POST', '/api/clinic/upgrade')).statusCode).toBe(200)
    expect(h.notify.sent.length).toBe(before)
  })

  it('endi shifokor qoʻshsa boʻladi', async () => {
    await expect(addStaff(h, 'shifokor')).resolves.toBeTruthy()
  })
})

describe('klinika → individual (paneldan)', () => {
  let h: Harness
  let admin: ReturnType<typeof client>
  let adminId = ''
  let doctorId = ''
  let assistantId = ''

  beforeAll(async () => {
    h = await startHarness()
    adminId = uuidV7()
    const email = `admin-tur-${adminId.slice(-8)}@example.com`
    await h.ownerDb.user.create({
      data: {
        id: adminId,
        email,
        passwordHash: await hashPassword('juda-yaxshi-admin-paroli'),
        emailVerifiedAt: new Date(),
      },
    })
    admin = client(h, await login(h, email, 'juda-yaxshi-admin-paroli'))

    doctorId = (await addStaff(h, 'shifokor')).id
    assistantId = (await addStaff(h, 'assistent', { doctorIds: [doctorId] })).id
  }, 30_000)

  afterAll(async () => {
    await h.ownerDb.user.delete({ where: { id: adminId } })
    await h.stop()
  })

  it('roʻyxat va kartochkada tur koʻrinadi', async () => {
    const card = await admin('GET', `/api/admin/clinics/${h.clinicId}`)
    expect(card.json().data.kind).toBe('clinic')
  })

  it('boshqa rollardagi faol xodim bor — rad, ismi bilan', async () => {
    const r = await admin('POST', `/api/admin/clinics/${h.clinicId}/kind`, { kind: 'solo' })
    expect(r.statusCode).toBe(409)
    expect(r.json().error.message).toContain('Xodim shifokor')
  })

  it('shifokor faolsizlantirilgach oʻtadi, assistent egasiga biriktiriladi', async () => {
    await client(h)('PATCH', `/api/staff/${doctorId}`, { status: 'disabled' })
    const r = await admin('POST', `/api/admin/clinics/${h.clinicId}/kind`, { kind: 'solo' })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.kind).toBe('solo')

    const links = await h.ownerDb.assistantDoctor.findMany({ where: { assistantId } })
    expect(links.map((link) => link.doctorId)).toEqual([h.userId])
  })

  it('hodisa platforma hodisalarida koʻrinadi', async () => {
    const events = (await admin('GET', '/api/admin/events?limit=50')).json().data as {
      action: string
    }[]
    expect(events.some((event) => event.action === 'clinic_kind_changed')).toBe(true)
  })

  it('klinika xodimi bu amalni bajara olmaydi', async () => {
    const r = await client(h)('POST', `/api/admin/clinics/${h.clinicId}/kind`, { kind: 'clinic' })
    expect(r.statusCode).toBe(403)
  })
})
