// Davolash rejalari (tz.md 18-boʻlim): reja → bosqichlar → bandlar,
// holat oqimi, narx snapshot va shifokorning koʻrinishi.

import { todayISO } from '@e-dentist/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generatePublicCode } from '../../platform/publicCode.js'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

let h: Harness
let patientId = ''
let serviceId = ''
let typeId = ''
let otherClinicId = ''
/// Ikki shifokor: reja oʻzinikimi yoki begonaning bemorinikimi
let doctorA = { id: '', cookie: '' }
let doctorB = { id: '', cookie: '' }
/// B ga biriktirilgan bemor — A uni koʻrmaydi
let patientOfB = ''

interface PlanItem {
  id: string
  treatment: string
  price: number
  qty: number
  total: number
  tooth: number | null
  status: string
  visitId: string | null
}

interface PlanStage {
  id: string
  name: string
  total: number
  items: PlanItem[]
}

interface Plan {
  id: string
  title: string
  status: string
  total: number
  discount: number
  payable: number
  itemCount: number
  doneCount: number
  publicCode: string
  validUntil: string | null
  expired: boolean
  declineReason: string | null
  cancelReason: string | null
  doctorName: string
  fio: string
  stages: PlanStage[]
}

function as(cookie: string) {
  return (method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, payload?: object) =>
    h.app.inject({ method, url, payload, headers: { cookie } })
}
const call = (method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, payload?: object) =>
  as(h.cookie)(method, url, payload)

async function createDoctor(name: string) {
  const roles = await h.ownerDb.role.findMany({ where: { clinicId: h.clinicId } })
  const role = roles.find((r) => r.template === 'shifokor')
  const email = `${name}-${h.clinicId.slice(0, 8)}@sinov.uz`
  const created = await call('POST', '/api/staff', {
    email,
    fullName: `Shifokor ${name}`,
    roleId: role?.id,
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

/// Bosqich va bandlari bilan tayyor reja
async function newPlan(extra: Record<string, unknown> = {}): Promise<Plan> {
  const created = await call('POST', '/api/plans', { patientId, ...extra })
  const id = created.json().data.id as string
  const saved = await call('PUT', `/api/plans/${id}/content`, {
    stages: [
      {
        name: '1-bosqich: davolash',
        items: [
          { tooth: 16, serviceId, treatment: 'Kariyes davolash', price: 300_000, qty: 2 },
          { treatment: 'Professional tozalash', price: 200_000 },
        ],
      },
      {
        name: '2-bosqich: protez',
        items: [{ tooth: 26, treatment: 'Koronka', price: 1_500_000 }],
      },
    ],
  })
  return saved.json().data as Plan
}

beforeAll(async () => {
  h = await startHarness()

  patientId = (await call('POST', '/api/patients', { fio: 'Reja Bemori' })).json().data.id

  const type = await call('POST', '/api/service-types', { name: 'Terapiya' })
  typeId = type.json().data.id
  serviceId = (
    await call('POST', '/api/services', {
      typeId,
      name: 'Kariyes davolash',
      price: 300_000,
    })
  ).json().data.id

  doctorA = await createDoctor('reja-a')
  doctorB = await createDoctor('reja-b')
  patientOfB = (
    await call('POST', '/api/patients', { fio: 'B ning Bemori', doctorId: doctorB.id })
  ).json().data.id

  const other = await createOtherClinic(h.ownerDb, 'B klinikasi')
  otherClinicId = other.id
}, 30_000)

afterAll(async () => {
  await removeClinic(h.ownerDb, otherClinicId)
  await h.stop()
})

describe('reja tuzish', () => {
  it('sukut nomi bilan tuziladi va ochiq kod oladi', async () => {
    const r = await call('POST', '/api/plans', { patientId })
    expect(r.statusCode).toBe(200)
    const plan = r.json().data as Plan
    expect(plan).toMatchObject({
      title: 'Davolash rejasi',
      status: 'draft',
      total: 0,
      payable: 0,
      itemCount: 0,
      fio: 'Reja Bemori',
      doctorName: 'Sinov Egasi',
    })
    expect(plan.publicCode).toMatch(/^[abcdefghjkmnpqrstuvwxyz23456789]{8}$/)
  })

  it('bosqichlar va bandlar tartibi bilan saqlanadi, jami hisoblanadi', async () => {
    const plan = await newPlan({ title: 'Implant rejasi' })

    expect(plan.stages.map((s) => s.name)).toEqual(['1-bosqich: davolash', '2-bosqich: protez'])
    expect(plan.stages[0]?.items.map((i) => i.treatment)).toEqual([
      'Kariyes davolash',
      'Professional tozalash',
    ])
    // 300 000 × 2 + 200 000 = 800 000
    expect(plan.stages[0]?.total).toBe(800_000)
    expect(plan.stages[1]?.total).toBe(1_500_000)
    expect(plan.total).toBe(2_300_000)
    expect(plan.payable).toBe(2_300_000)
    expect(plan.itemCount).toBe(3)
  })

  it('chegirma toʻlanadigan summadan ayriladi', async () => {
    const plan = await newPlan()
    const r = await call('PATCH', `/api/plans/${plan.id}`, { discount: 300_000 })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({ total: 2_300_000, discount: 300_000, payable: 2_000_000 })
  })

  it('chegirma jamidan katta boʻlsa 400', async () => {
    const plan = await newPlan()
    const r = await call('PATCH', `/api/plans/${plan.id}`, { discount: 9_000_000 })
    expect(r.statusCode).toBe(400)
  })

  it('bir bemorda bir nechta reja — variantlar', async () => {
    await call('POST', '/api/plans', { patientId, title: 'Arzon variant' })
    await call('POST', '/api/plans', { patientId, title: 'Qimmat variant' })
    const r = await call('GET', `/api/plans?patientId=${patientId}`)
    const titles = (r.json().data as Plan[]).map((p) => p.title)
    expect(titles).toContain('Arzon variant')
    expect(titles).toContain('Qimmat variant')
  })
})

describe('narx snapshot', () => {
  it('xizmat narxi oʻzgarsa tuzilgan reja oʻzgarmaydi', async () => {
    const plan = await newPlan()
    await call('PATCH', `/api/services/${serviceId}`, { price: 900_000 })

    const r = await call('GET', `/api/plans/${plan.id}`)
    const item = (r.json().data as Plan).stages[0]?.items[0]
    expect(item?.price).toBe(300_000)
    expect(r.json().data.total).toBe(2_300_000)

    await call('PATCH', `/api/services/${serviceId}`, { price: 300_000 })
  })
})

describe('holat oqimi', () => {
  it('qoralama → yuborildi → qabul qilindi', async () => {
    const plan = await newPlan()

    const sent = await call('POST', `/api/plans/${plan.id}/status`, { status: 'sent' })
    expect(sent.json().data.status).toBe('sent')

    const accepted = await call('POST', `/api/plans/${plan.id}/status`, { status: 'accepted' })
    expect(accepted.statusCode).toBe(200)
    expect(accepted.json().data.status).toBe('accepted')
  })

  it('qoralamadan toʻgʻridan-toʻgʻri qabul qilinmaydi', async () => {
    const plan = await newPlan()
    const r = await call('POST', `/api/plans/${plan.id}/status`, { status: 'accepted' })
    expect(r.statusCode).toBe(400)
  })

  it('rad etish va bekor qilish sababsiz oʻtmaydi', async () => {
    const plan = await newPlan()
    await call('POST', `/api/plans/${plan.id}/status`, { status: 'sent' })

    const noReason = await call('POST', `/api/plans/${plan.id}/status`, { status: 'declined' })
    expect(noReason.statusCode).toBe(400)

    const declined = await call('POST', `/api/plans/${plan.id}/status`, {
      status: 'declined',
      reason: 'Qimmat',
    })
    expect(declined.json().data).toMatchObject({ status: 'declined', declineReason: 'Qimmat' })
  })

  it('rad etilgan reja qayta yuboriladi va eski sabab tozalanadi', async () => {
    const plan = await newPlan()
    await call('POST', `/api/plans/${plan.id}/status`, { status: 'sent' })
    await call('POST', `/api/plans/${plan.id}/status`, { status: 'declined', reason: 'Qimmat' })

    const again = await call('POST', `/api/plans/${plan.id}/status`, { status: 'sent' })
    expect(again.json().data).toMatchObject({ status: 'sent', declineReason: null })
  })

  it('bekor qilingan reja oʻzgartirilmaydi va qayta bekor qilinmaydi', async () => {
    const plan = await newPlan()
    const cancelled = await call('POST', `/api/plans/${plan.id}/status`, {
      status: 'cancelled',
      reason: 'Bemor boshqa klinikaga ketdi',
    })
    expect(cancelled.json().data).toMatchObject({
      status: 'cancelled',
      cancelReason: 'Bemor boshqa klinikaga ketdi',
    })

    expect((await call('PATCH', `/api/plans/${plan.id}`, { title: 'Yangi nom' })).statusCode).toBe(
      400,
    )
    expect((await call('PUT', `/api/plans/${plan.id}/content`, { stages: [] })).statusCode).toBe(
      400,
    )
    expect(
      (
        await call('POST', `/api/plans/${plan.id}/status`, {
          status: 'cancelled',
          reason: 'Yana',
        })
      ).statusCode,
    ).toBe(400)
  })
})

describe('mazmunni qayta saqlash', () => {
  it('kelmagan band oʻchadi, id bilan kelgani yangilanadi', async () => {
    const plan = await newPlan()
    const first = plan.stages[0]
    const keep = first?.items[0]

    const r = await call('PUT', `/api/plans/${plan.id}/content`, {
      stages: [
        {
          id: first?.id,
          name: '1-bosqich',
          items: [{ id: keep?.id, treatment: 'Kariyes davolash', price: 350_000, qty: 1 }],
        },
      ],
    })
    expect(r.statusCode).toBe(200)
    const saved = r.json().data as Plan
    expect(saved.stages).toHaveLength(1)
    expect(saved.stages[0]?.items).toHaveLength(1)
    expect(saved.stages[0]?.items[0]).toMatchObject({
      id: keep?.id,
      price: 350_000,
      total: 350_000,
    })
    expect(saved.total).toBe(350_000)
  })

  it('begona bosqich id si bilan 404', async () => {
    const plan = await newPlan()
    const other = await newPlan()
    const r = await call('PUT', `/api/plans/${plan.id}/content`, {
      stages: [{ id: other.stages[0]?.id, name: 'Begona', items: [] }],
    })
    expect(r.statusCode).toBe(404)
  })

  it('bandsiz reja ham saqlanadi', async () => {
    const plan = await newPlan()
    const r = await call('PUT', `/api/plans/${plan.id}/content`, { stages: [] })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({ total: 0, itemCount: 0, stages: [] })
  })

  it('notoʻgʻri tish raqami 400', async () => {
    const plan = await newPlan()
    const r = await call('PUT', `/api/plans/${plan.id}/content`, {
      stages: [{ name: 'Bosqich', items: [{ tooth: 99, treatment: 'Ish', price: 1000 }] }],
    })
    expect(r.statusCode).toBe(400)
  })

  // Xizmatning qoʻllanish sohasi (19-boʻlim) bandda ham amal qiladi
  it('tish soʻramaydigan xizmat bandi tishsiz saqlanadi, tish xizmati — 400', async () => {
    const mouth = (
      await call('POST', '/api/services', {
        typeId,
        name: 'Professional tozalash',
        price: 300_000,
        area: 'mouth',
      })
    ).json().data.id

    const plan = await newPlan()
    const ok = await call('PUT', `/api/plans/${plan.id}/content`, {
      stages: [
        {
          name: 'Bosqich',
          // Tish yuborilsa ham soha butun ogʻiz — bandda qolmaydi
          items: [{ tooth: 21, serviceId: mouth, treatment: 'Tozalash', price: 300_000 }],
        },
      ],
    })
    expect(ok.statusCode).toBe(200)
    expect(ok.json().data.stages[0].items[0].tooth).toBeNull()

    const bad = await call('PUT', `/api/plans/${plan.id}/content`, {
      stages: [
        { name: 'Bosqich', items: [{ serviceId, treatment: 'Kariyes davolash', price: 300_000 }] },
      ],
    })
    expect(bad.statusCode).toBe(400)
    expect(bad.json().error.fields.tooth).toMatch(/tish/i)
  })
})

describe('shifokorning koʻrinishi', () => {
  it('boshqa shifokorning bemorining rejasini koʻrmaydi', async () => {
    const created = await call('POST', '/api/plans', { patientId: patientOfB })
    const id = created.json().data.id as string

    expect((await as(doctorB.cookie)('GET', `/api/plans/${id}`)).statusCode).toBe(200)
    expect((await as(doctorA.cookie)('GET', `/api/plans/${id}`)).statusCode).toBe(404)
  })

  it('roʻyxatda faqat oʻzi koʻradigan bemorlarning rejalari', async () => {
    await call('POST', '/api/plans', { patientId: patientOfB, title: 'B ning rejasi' })
    const r = await as(doctorA.cookie)('GET', '/api/plans')
    expect(r.statusCode).toBe(200)
    expect((r.json().data as Plan[]).some((p) => p.fio === 'B ning Bemori')).toBe(false)
  })

  it('shifokor rejani faqat oʻz nomidan tuzadi', async () => {
    const r = await as(doctorA.cookie)('POST', '/api/plans', { patientId, doctorId: doctorB.id })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.doctorName).toBe('Shifokor reja-a')
  })

  it('shifokorni almashtirish faqat egasida', async () => {
    const plan = await newPlan()
    expect(
      (await as(doctorA.cookie)('PATCH', `/api/plans/${plan.id}`, { doctorId: doctorB.id }))
        .statusCode,
    ).toBe(403)
    const byOwner = await call('PATCH', `/api/plans/${plan.id}`, { doctorId: doctorB.id })
    expect(byOwner.json().data.doctorName).toBe('Shifokor reja-b')
  })
})

describe('koʻp ijarachilik', () => {
  it('B klinikaning rejasi A ning sessiyasida koʻrinmaydi', async () => {
    const patient = await h.ownerDb.patient.create({
      data: { clinicId: otherClinicId, fio: 'Begona Bemor', fioSearch: 'begona bemor' },
    })
    const staff = await h.ownerDb.user.findFirst({ where: { clinicId: otherClinicId } })
    const alien = await h.ownerDb.treatmentPlan.create({
      data: {
        clinicId: otherClinicId,
        patientId: patient.id,
        doctorId: staff?.id ?? patient.id,
        title: 'Begona reja',
        publicCode: generatePublicCode(),
        createdBy: staff?.id ?? patient.id,
      },
    })

    expect((await call('GET', `/api/plans/${alien.id}`)).statusCode).toBe(404)
    expect((await call('PATCH', `/api/plans/${alien.id}`, { title: 'Egallandi' })).statusCode).toBe(
      404,
    )
    expect((await call('POST', '/api/plans', { patientId: patient.id })).statusCode).toBe(404)

    const list = await call('GET', '/api/plans')
    expect((list.json().data as Plan[]).some((p) => p.title === 'Begona reja')).toBe(false)
  })
})

describe('ruxsatlar', () => {
  it('kirmagan odam rejani koʻrmaydi', async () => {
    const r = await h.app.inject({ method: 'GET', url: '/api/plans' })
    expect(r.statusCode).toBe(401)
  })
})

describe('bandni bajarish — tashrif yoziladi', () => {
  /// Rejaning birinchi bandi (16-tish, 300 000 × 2)
  const firstItem = (plan: Plan) => plan.stages[0]?.items[0] as PlanItem

  async function complete(plan: Plan, item: PlanItem, extra: Record<string, unknown> = {}) {
    return call('POST', `/api/plans/${plan.id}/items/${item.id}/complete`, {
      date: todayISO(),
      treatment: item.treatment,
      tooth: item.tooth,
      price: item.total,
      ...extra,
    })
  }

  it('tashrif yoziladi, band «bajarildi» boʻladi', async () => {
    const plan = await newPlan()
    const item = firstItem(plan)

    const r = await complete(plan, item)
    expect(r.statusCode).toBe(200)
    const saved = r.json().data.plan as Plan
    expect(saved.stages[0]?.items[0]).toMatchObject({ status: 'done' })
    expect(saved.stages[0]?.items[0]?.visitId).toBe(r.json().data.visit.id)
    expect(saved.doneCount).toBe(1)

    // Tashrif bemorning kartochkasida — narx va tish banddan
    const visits = await call('GET', `/api/patients/${patientId}/visits`)
    const written = (
      visits.json().data as { id: string; price: number; tooth: number | null }[]
    ).find((visit) => visit.id === r.json().data.visit.id)
    expect(written).toMatchObject({ price: 600_000, tooth: 16 })
  })

  it('bajarilgan bandni qayta bajarib boʻlmaydi', async () => {
    const plan = await newPlan()
    const item = firstItem(plan)
    await complete(plan, item)
    expect((await complete(plan, item)).statusCode).toBe(400)
  })

  it('bajarilgan band oʻchirilmaydi va oʻtkazib yuborilmaydi', async () => {
    const plan = await newPlan()
    const item = firstItem(plan)
    await complete(plan, item)

    const withoutItem = await call('PUT', `/api/plans/${plan.id}/content`, {
      stages: [{ id: plan.stages[0]?.id, name: '1-bosqich', items: [] }],
    })
    expect(withoutItem.statusCode).toBe(400)

    const skipped = await call('POST', `/api/plans/${plan.id}/items/${item.id}/skip`, {})
    expect(skipped.statusCode).toBe(400)
  })

  it('oxirgi band hal boʻlgach reja «bajarildi» ga oʻtadi', async () => {
    const plan = await newPlan()
    const items = plan.stages.flatMap((stage) => stage.items)

    for (const item of items.slice(0, -1)) {
      await call('POST', `/api/plans/${plan.id}/items/${item.id}/skip`, {})
    }
    const beforeLast = await call('GET', `/api/plans/${plan.id}`)
    expect(beforeLast.json().data.status).toBe('draft')

    const last = items.at(-1) as PlanItem
    const r = await complete(plan, last)
    expect(r.json().data.plan.status).toBe('done')

    // Bajarilgan reja qotadi
    expect((await call('PATCH', `/api/plans/${plan.id}`, { title: 'Yangi' })).statusCode).toBe(400)
  })

  it('tashrif oʻchirilsa band «kutilmoqda» ga qaytadi', async () => {
    const plan = await newPlan()
    const item = firstItem(plan)
    const r = await complete(plan, item)
    const visitId = r.json().data.visit.id as string

    await call('DELETE', `/api/visits/${visitId}`)

    const after = await call('GET', `/api/plans/${plan.id}`)
    expect((after.json().data as Plan).stages[0]?.items[0]).toMatchObject({
      status: 'pending',
      visitId: null,
    })
  })

  it('begona rejaning bandi 404', async () => {
    const plan = await newPlan()
    const other = await newPlan()
    const alien = firstItem(other)
    expect((await complete(plan, alien)).statusCode).toBe(404)
  })

  it('shifokor ulushi oʻsha tashrifda hisoblanadi', async () => {
    // Shifokor A — 40%. Reja ham, band ham uning nomidan
    const created = await as(doctorA.cookie)('POST', '/api/plans', { patientId })
    const planId = created.json().data.id as string
    const saved = await as(doctorA.cookie)('PUT', `/api/plans/${planId}/content`, {
      stages: [{ name: 'Bosqich', items: [{ tooth: 16, treatment: 'Ish', price: 600_000 }] }],
    })
    const itemId = (saved.json().data as Plan).stages[0]?.items[0]?.id as string

    const r = await as(doctorA.cookie)('POST', `/api/plans/${planId}/items/${itemId}/complete`, {
      date: todayISO(),
      treatment: 'Ish',
      tooth: 16,
      price: 600_000,
    })
    expect(r.statusCode).toBe(200)

    const visit = await h.ownerDb.visit.findUnique({ where: { id: r.json().data.visit.id } })
    // 600 000 × 40% = 240 000
    expect(visit).toMatchObject({ doctorId: doctorA.id, doctorPercent: 40, doctorShare: 240_000 })
  })

  it('oʻtkazib yuborilgan band qaytariladi', async () => {
    const plan = await newPlan()
    const item = firstItem(plan)

    await call('POST', `/api/plans/${plan.id}/items/${item.id}/skip`, {})
    const back = await call('POST', `/api/plans/${plan.id}/items/${item.id}/skip`, { skip: false })
    expect(back.json().data.stages[0].items[0]).toMatchObject({ status: 'pending' })
  })
})

describe('ochiq sahifa /r/:kod', () => {
  /// Sessiyasiz — bemorning brauzeri kabi
  const open = (method: 'GET' | 'POST', url: string, payload?: object) =>
    h.app.inject({ method, url, payload, remoteAddress: h.clientIp })

  async function sentPlan(extra: Record<string, unknown> = {}) {
    const plan = await newPlan(extra)
    await call('POST', `/api/plans/${plan.id}/status`, { status: 'sent' })
    return (await call('GET', `/api/plans/${plan.id}`)).json().data as Plan
  }

  it('yuborilgan reja koʻrinadi, bemor ismi qisqartirilgan', async () => {
    const plan = await sentPlan()
    const r = await open('GET', `/api/r/${plan.publicCode}`)
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({
      // «Reja Bemori» — familiya + bosh harf
      patientName: 'Reja B.',
      doctorName: 'Sinov Egasi',
      status: 'sent',
      total: 2_300_000,
      payable: 2_300_000,
      canRespond: true,
      needsPhone: false,
    })
    expect(r.json().data.teeth).toEqual([16, 26])
    expect(r.json().data.stages).toHaveLength(2)
  })

  it('qoralama va bekor qilingan reja koʻrinmaydi', async () => {
    const draft = await newPlan()
    expect((await open('GET', `/api/r/${draft.publicCode}`)).statusCode).toBe(404)

    const cancelled = await newPlan()
    await call('POST', `/api/plans/${cancelled.id}/status`, {
      status: 'cancelled',
      reason: 'Sinov',
    })
    expect((await open('GET', `/api/r/${cancelled.publicCode}`)).statusCode).toBe(404)
  })

  it('notoʻgʻri kod 404', async () => {
    expect((await open('GET', '/api/r/yoqkodxx')).statusCode).toBe(404)
  })

  it('telefonsiz bemor raqamsiz rozilik bildiradi', async () => {
    const plan = await sentPlan()
    const r = await open('POST', `/api/r/${plan.publicCode}`, { accept: true })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.status).toBe('accepted')

    const saved = await call('GET', `/api/plans/${plan.id}`)
    expect(saved.json().data.status).toBe('accepted')
  })

  it('telefonli bemorda oxirgi 4 raqam soʻraladi va tekshiriladi', async () => {
    const withPhone = (
      await call('POST', '/api/patients', { fio: 'Telefonli Bemor', phone: '+998901234567' })
    ).json().data.id as string
    const created = await call('POST', '/api/plans', { patientId: withPhone })
    const id = created.json().data.id as string
    await call('PUT', `/api/plans/${id}/content`, {
      stages: [{ name: 'Bosqich', items: [{ treatment: 'Ish', price: 100_000 }] }],
    })
    await call('POST', `/api/plans/${id}/status`, { status: 'sent' })
    const code = created.json().data.publicCode as string

    expect((await open('GET', `/api/r/${code}`)).json().data.needsPhone).toBe(true)
    // Raqamsiz va notoʻgʻri raqam bilan oʻtmaydi
    expect((await open('POST', `/api/r/${code}`, { accept: true })).statusCode).toBe(400)
    expect(
      (await open('POST', `/api/r/${code}`, { accept: true, phoneTail: '0000' })).statusCode,
    ).toBe(400)

    const ok = await open('POST', `/api/r/${code}`, { accept: true, phoneTail: '4567' })
    expect(ok.statusCode).toBe(200)
  })

  it('rad etish sababi kabinetda koʻrinadi', async () => {
    const plan = await sentPlan()
    const r = await open('POST', `/api/r/${plan.publicCode}`, {
      accept: false,
      reason: 'Hozircha imkonim yoʻq',
    })
    expect(r.json().data.status).toBe('declined')

    const saved = await call('GET', `/api/plans/${plan.id}`)
    expect(saved.json().data).toMatchObject({
      status: 'declined',
      declineReason: 'Hozircha imkonim yoʻq',
    })
  })

  it('ikkinchi javob 409', async () => {
    const plan = await sentPlan()
    await open('POST', `/api/r/${plan.publicCode}`, { accept: true })
    const again = await open('POST', `/api/r/${plan.publicCode}`, { accept: true })
    expect(again.statusCode).toBe(409)
  })

  it('muddati oʻtgan rejaga javob berilmaydi', async () => {
    const plan = await newPlan()
    await call('PATCH', `/api/plans/${plan.id}`, { validUntil: '2020-01-01' })
    await call('POST', `/api/plans/${plan.id}/status`, { status: 'sent' })

    const page = await open('GET', `/api/r/${plan.publicCode}`)
    expect(page.json().data).toMatchObject({ expired: true, canRespond: false })
    expect((await open('POST', `/api/r/${plan.publicCode}`, { accept: true })).statusCode).toBe(400)
  })

  it('begona klinikaning kodi oʻz klinikasidan oʻqilmaydi', async () => {
    const plan = await sentPlan()
    // Ochiq sahifa sessiyaga qaramaydi — kod qaysi klinikaniki boʻlsa,
    // javob oʻshaniki. Kod boshqa klinikada yoʻq boʻlsa — 404
    const alien = await open('GET', `/api/r/${plan.publicCode.slice(0, 7)}z`)
    expect(alien.statusCode).toBe(404)
  })
})
