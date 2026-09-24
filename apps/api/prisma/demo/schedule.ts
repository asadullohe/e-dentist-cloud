// Bugun va keyingi hafta: qabullar, navbat, naryadlar, rejalar, fikrlar

import { daysFromToday, hm, iso, isSunday, publicPost } from './client.js'
import { type Ctx, chance, int, pick } from './context.js'
import type { StaffKey } from './data.js'
import type { PatientRef } from './history.js'

const DOCTORS: StaffKey[] = ['owner', 'dilnoza', 'sardor']

const NOTES = ['Tish ogʻrigʻi', 'Koʻrik', 'Plomba tushgan', 'Nazorat koʻrigi', 'Tozalash', '']

export async function createSchedule(ctx: Ctx, patients: PatientRef[]): Promise<void> {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const queued = new Set<string>()

  for (let offset = 0; offset <= 7; offset++) {
    const date = daysFromToday(offset)
    if (isSunday(date)) continue
    const day = iso(date)
    for (const doctor of DOCTORS) {
      const doctorId = ctx.staff[doctor]
      const own = patients.filter((p) => p.doctor === doctor)
      const count = offset === 0 ? int(ctx, 4, 6) : int(ctx, 2, 5)
      for (let i = 0; i < count; i++) {
        const duration = chance(ctx, 0.3) ? 60 : 30
        const start = ctx.slots.take(doctorId, day, duration, 9 * 60 + int(ctx, 0, 16) * 30)
        if (start === null) continue
        const patient = pick(ctx, own.length > 0 ? own : patients)
        const appt = await ctx.owner.post<{ id: string }>('/appointments', {
          patientId: patient.id,
          doctorId,
          date: day,
          time: hm(start),
          duration,
          note: pick(ctx, NOTES) || undefined,
        })
        // Bugun oʻtib ketgan vaqtdagilar: kelgan yoki kelmagan
        if (offset === 0 && start + duration <= nowMin) {
          const status = chance(ctx, 0.15) ? 'no_show' : 'arrived'
          await ctx.owner.patch(`/appointments/${appt.id}`, { status })
          if (status === 'arrived' && !queued.has(patient.id) && queued.size < 4) {
            await ctx.owner.post('/queue', { patientId: patient.id, doctorId })
            queued.add(patient.id)
          }
        } else if (offset > 0 && chance(ctx, 0.05)) {
          await ctx.owner.patch(`/appointments/${appt.id}`, { status: 'cancelled' })
        }
      }
    }
  }
}

export async function createLabOrders(ctx: Ctx, patients: PatientRef[]): Promise<void> {
  const ortho = patients.filter((p) => p.doctor === 'sardor' && !p.child)
  const specs = [
    { teeth: [26], workType: 'crown', material: 'zirconia', shade: 'A2', due: 4, state: 'issued' },
    { teeth: [14, 15, 16], workType: 'bridge', material: 'metal_ceramic', due: 6, state: 'issued' },
    {
      teeth: [46],
      workType: 'crown',
      material: 'metal_ceramic',
      shade: 'A3',
      due: 1,
      state: 'ready',
    },
    { teeth: [11, 21], workType: 'veneer', material: 'press_ceramic', due: 0, state: 'deliver' },
  ] as const
  for (const [i, spec] of specs.entries()) {
    const patient = ortho[i % ortho.length]
    if (!patient) return
    const tech =
      spec.workType === 'bridge' ? 1_200_000 : spec.workType === 'veneer' ? 2_000_000 : 400_000
    const order = await ctx.sardor.post<{ id: string }>('/lab-orders', {
      patientId: patient.id,
      techId: ctx.staff.bobur,
      teeth: spec.teeth,
      workType: spec.workType,
      material: spec.material,
      shade: 'shade' in spec ? spec.shade : undefined,
      dueDate: iso(daysFromToday(spec.due)),
      techPrice: tech,
    })
    if (spec.state === 'issued') continue
    await ctx.bobur.patch(`/lab-orders/${order.id}/status`, { status: 'ready' })
    if (spec.state === 'deliver') {
      const veneer = ctx.services.veneer
      await ctx.sardor.post(`/lab-orders/${order.id}/deliver`, {
        treatment: 'Vinir (E-max) — 2 ta',
        serviceId: veneer?.id,
        tooth: 11,
        price: 6_000_000,
      })
    }
  }
}

interface PlanView {
  id: string
  stages: { items: { id: string }[] }[]
}

export async function createPlans(ctx: Ctx, patients: PatientRef[]): Promise<void> {
  const adults = patients.filter((p) => !p.child)
  const svc = (key: string) => {
    const s = ctx.services[key]
    if (!s) throw new Error(`Xizmat topilmadi: ${key}`)
    return { serviceId: s.id, treatment: s.name, price: s.price }
  }
  const until = iso(daysFromToday(30))

  // 1. Qabul qilingan toʻliq reja: sanatsiya + koʻprik, birinchi band bajarilgan
  const full = await plan(ctx, adults[0], 'Toʻliq sanatsiya va protezlash', 500_000, until, [
    {
      name: 'Sanatsiya',
      items: [
        { tooth: 37, ...svc('caries') },
        { tooth: 47, ...svc('canal3') },
        { tooth: 47, ...svc('filling') },
      ],
    },
    {
      name: 'Protezlash',
      groups: [{ name: 'Koʻprik 14–16', teeth: [14, 15, 16], pontics: [15] }],
      items: [14, 15, 16].map((tooth) => ({ tooth, groupIndex: 0, ...svc('bridgeUnit') })),
    },
  ])
  await ctx.owner.post(`/plans/${full.id}/status`, { status: 'sent' })
  await ctx.owner.post(`/plans/${full.id}/status`, { status: 'accepted' })
  const first = full.stages[0]?.items[0]
  if (first) {
    const s = svc('caries')
    await ctx.owner.post(`/plans/${full.id}/items/${first.id}/complete`, {
      date: iso(daysFromToday(-2)),
      doctorId: ctx.staff.sardor,
      tooth: 37,
      ...s,
    })
  }

  // 2. Yuborilgan: implant va toj
  const implant = await plan(ctx, adults[1], 'Implantatsiya', 0, until, [
    { name: 'Jarrohlik', items: [{ tooth: 36, ...svc('implant') }] },
    { name: 'Protezlash', items: [{ tooth: 36, ...svc('crownZr') }] },
  ])
  await ctx.owner.post(`/plans/${implant.id}/status`, { status: 'sent' })

  // 3. Qoralama: gigiyena va oqartirish
  await plan(ctx, adults[2], 'Estetika', 150_000, until, [
    { name: 'Gigiyena', items: [svc('cleaning'), svc('whitening')] },
  ])

  // 4. Rad etilgan
  const veneers = await plan(ctx, adults[3], 'Vinirlar', 0, until, [
    { name: 'Vinirlar', items: [11, 12, 21, 22].map((tooth) => ({ tooth, ...svc('veneer') })) },
  ])
  await ctx.owner.post(`/plans/${veneers.id}/status`, { status: 'sent' })
  await ctx.owner.post(`/plans/${veneers.id}/status`, {
    status: 'declined',
    reason: 'Narxi hozircha qimmatlik qildi, keyinroq qaytadi',
  })
}

async function plan(
  ctx: Ctx,
  patient: PatientRef | undefined,
  title: string,
  discount: number,
  validUntil: string,
  stages: unknown[],
): Promise<PlanView> {
  if (!patient) throw new Error('Reja uchun bemor yetmadi')
  const created = await ctx.owner.post<PlanView>('/plans', {
    patientId: patient.id,
    doctorId: ctx.staff.sardor,
    title,
    validUntil,
  })
  const filled = await ctx.owner.put<PlanView>(`/plans/${created.id}/content`, { stages })
  if (discount > 0) await ctx.owner.patch(`/plans/${created.id}`, { discount })
  return filled
}

const FEEDBACK = [
  {
    rating: 5,
    tags: ['attitude', 'treatment'],
    comment: 'Juda yoqdi, ogʻriqsiz davolashdi. Rahmat!',
  },
  { rating: 5, tags: ['cleanliness'], comment: 'Klinika toza, shifokor muloyim' },
  { rating: 4, tags: ['treatment'], comment: 'Yaxshi, faqat biroz kutdim' },
  { rating: 5, tags: ['attitude'], comment: 'Bolam qoʻrqmadi, rahmat Dilnoza opaga' },
  { rating: 3, tags: ['waiting'], comment: 'Yozilgan vaqtimdan 40 daqiqa kechikib kirdim' },
  { rating: 2, tags: ['price'], comment: 'Narxlar oldindan aytilganidan qimmat chiqdi' },
  { rating: 5, tags: [], comment: '' },
]

export async function createFeedback(ctx: Ctx, queueCode: string): Promise<void> {
  for (const f of FEEDBACK) {
    const doctor = pick(ctx, DOCTORS)
    const res = await publicPost<{ id: string }>(`/f/${queueCode}`, {
      rating: f.rating,
      tags: f.tags,
      comment: f.comment || undefined,
      doctorId: ctx.staff[doctor],
      source: chance(ctx, 0.5) ? 'qr' : 'page',
    })
    const at = daysFromToday(-int(ctx, 1, 60))
    await ctx.db.$executeRaw`UPDATE feedback SET created_at = ${at} WHERE id = ${res.id}::uuid`
  }
}
