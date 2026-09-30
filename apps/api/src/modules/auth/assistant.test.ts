// Assistent va individual kabinet chegarasi (tz.md 20-boʻlim)

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

interface Role {
  id: string
  template: string
}

function client(h: Harness) {
  function call(method: 'GET' | 'POST' | 'PATCH', url: string, payload?: object) {
    return h.app.inject({
      method,
      url,
      payload,
      headers: { cookie: h.cookie },
      remoteAddress: h.clientIp,
    })
  }

  async function roleId(template: string): Promise<string> {
    const roles = (await call('GET', '/api/roles')).json().data as Role[]
    return roles.find((role) => role.template === template)?.id ?? ''
  }

  let n = 0
  async function add(template: string, extra: Record<string, unknown> = {}) {
    n += 1
    return call('POST', '/api/staff', {
      email: `${template}-${n}-${h.clinicId}@example.com`,
      fullName: 'Yangi Xodim',
      roleId: await roleId(template),
      password: 'juda-yaxshi-parol',
      ...extra,
    })
  }

  return { call, roleId, add }
}

describe('klinikada assistent', () => {
  let h: Harness
  let api: ReturnType<typeof client>
  let doctorId = ''
  let assistantId = ''
  let otherClinicId = ''
  let otherDoctorId = ''

  beforeAll(async () => {
    h = await startHarness()
    api = client(h)
    doctorId = (await api.add('shifokor')).json().data.id

    // B klinikaning shifokori — A ning assistentiga biriktirilmasligi kerak
    const other = await createOtherClinic(h.ownerDb)
    otherClinicId = other.id
    const otherDoctor = await h.ownerDb.user.create({
      data: { clinicId: other.id, email: `b-shifokor-${other.id}@example.com`, passwordHash: 'x' },
    })
    otherDoctorId = otherDoctor.id
  }, 30_000)

  afterAll(async () => {
    await removeClinic(h.ownerDb, otherClinicId)
    await h.stop()
  })

  it('shifokor tanlanmasa rad etiladi', async () => {
    const r = await api.add('assistent')
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.doctorIds).toBe('Assistent kimga yordam berishini tanlang')
  })

  it('boshqa klinikaning shifokori — «topilmadi»', async () => {
    const r = await api.add('assistent', { doctorIds: [otherDoctorId] })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.doctorIds).toBe('Tanlangan shifokor topilmadi')
  })

  it('bir nechta shifokorga biriktiriladi', async () => {
    const r = await api.add('assistent', { doctorIds: [doctorId, h.userId] })
    expect(r.statusCode).toBe(200)
    assistantId = r.json().data.id
    expect(r.json().data.roleTemplate).toBe('assistent')
    expect([...r.json().data.doctorIds].sort()).toEqual([doctorId, h.userId].sort())

    const list = (await api.call('GET', '/api/staff')).json().data as {
      id: string
      doctorIds: string[]
    }[]
    expect(list.find((p) => p.id === assistantId)?.doctorIds).toHaveLength(2)
  })

  it('oylik oʻzgarsa shifokorlari joyida qoladi', async () => {
    const r = await api.call('PATCH', `/api/staff/${assistantId}`, { salaryAmount: 3_000_000 })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.doctorIds).toHaveLength(2)
  })

  it('shifokorlar roʻyxati almashtiriladi', async () => {
    const r = await api.call('PATCH', `/api/staff/${assistantId}`, { doctorIds: [doctorId] })
    expect(r.json().data.doctorIds).toEqual([doctorId])
  })

  it('boshqa rolga oʻtsa bogʻlanishlar olinadi, qaytishda qayta soʻraladi', async () => {
    const toDoctor = await api.call('PATCH', `/api/staff/${assistantId}`, {
      roleId: await api.roleId('qabulxona'),
    })
    expect(toDoctor.json().data.doctorIds).toEqual([])
    expect(await h.ownerDb.assistantDoctor.count({ where: { assistantId } })).toBe(0)

    const back = await api.call('PATCH', `/api/staff/${assistantId}`, {
      roleId: await api.roleId('assistent'),
    })
    expect(back.statusCode).toBe(400)

    const withDoctors = await api.call('PATCH', `/api/staff/${assistantId}`, {
      roleId: await api.roleId('assistent'),
      doctorIds: [doctorId],
    })
    expect(withDoctors.statusCode).toBe(200)
  })
})

describe('individual kabinet', () => {
  let h: Harness
  let api: ReturnType<typeof client>
  let firstId = ''

  beforeAll(async () => {
    h = await startHarness({ kind: 'solo' })
    api = client(h)
  }, 30_000)

  afterAll(async () => {
    await h.stop()
  })

  it('assistentdan boshqa rol — «klinikaga oʻting»', async () => {
    for (const template of ['shifokor', 'qabulxona', 'texnik', 'kuzatuvchi']) {
      const r = await api.add(template)
      expect(r.statusCode).toBe(403)
      expect(r.json().error.code).toBe('upgrade_required')
    }
  })

  it('assistent shifokor soʻralmasdan egasiga biriktiriladi', async () => {
    const r = await api.add('assistent')
    expect(r.statusCode).toBe(200)
    expect(r.json().data.doctorIds).toEqual([h.userId])
    firstId = r.json().data.id
  })

  it('uchinchi faol assistent — «klinikaga oʻting»', async () => {
    expect((await api.add('assistent')).statusCode).toBe(200)
    const third = await api.add('assistent')
    expect(third.statusCode).toBe(403)
    expect(third.json().error.code).toBe('upgrade_required')
  })

  it('faolsizlantirilgan assistent hisobga kirmaydi', async () => {
    await api.call('PATCH', `/api/staff/${firstId}`, { status: 'disabled' })
    expect((await api.add('assistent')).statusCode).toBe(200)

    // Qayta yoqilsa chegara yana tekshiriladi
    const again = await api.call('PATCH', `/api/staff/${firstId}`, { status: 'active' })
    expect(again.json().error.code).toBe('upgrade_required')
  })

  it('assistentni boshqa rolga oʻtkazib boʻlmaydi', async () => {
    const r = await api.call('PATCH', `/api/staff/${firstId}`, {
      roleId: await api.roleId('qabulxona'),
    })
    expect(r.json().error.code).toBe('upgrade_required')
  })
})
