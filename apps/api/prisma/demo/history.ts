// Bemorlar va oxirgi uch oylik davolanish tarixi: tashrif → toʻlov → xarita.
// Soʻnggi uch haftadagi tashriflar qabul orqali yoziladi (qabul → yakunlash),
// shunda jadvalda ham koʻrinadi

import { daysFromToday, hm, iso, isSunday } from './client.js'
import { type Ctx, chance, int, pick, roundMoney } from './context.js'
import { DISTRICTS, FEMALE, MALE, PHONE_CODES, RUSSIAN, type StaffKey, SURNAMES } from './data.js'
import { type Step, scenarioFor } from './scenarios.js'

export interface PatientRef {
  id: string
  fio: string
  doctor: StaffKey
  child: boolean
}

const RECENT_DAYS = 21

function person(ctx: Ctx, i: number) {
  const phone = `+998${pick(ctx, PHONE_CODES)}${String(int(ctx, 1_000_000, 9_999_999))}`
  const age = i % 9 === 0 ? int(ctx, 5, 12) : int(ctx, 18, 68)
  const birth = daysFromToday(-(age * 365 + int(ctx, 0, 364)))
  if (i % 11 === 5) return { fio: pick(ctx, RUSSIAN), phone, birth, child: false }
  const male = chance(ctx, 0.45)
  const surname = pick(ctx, SURNAMES)
  const fio = male ? `${surname} ${pick(ctx, MALE)}` : `${surname}a ${pick(ctx, FEMALE)}`
  return { fio, phone, birth, child: age < 14 }
}

const nextWorkday = (d: Date) => {
  while (isSunday(d)) d.setDate(d.getDate() + 1)
  return d
}

export async function createHistory(ctx: Ctx, count: number, since: Date): Promise<PatientRef[]> {
  const patients: PatientRef[] = []
  const span = Math.floor((daysFromToday(0).getTime() - since.getTime()) / 86_400_000)
  for (let i = 0; i < count; i++) {
    const p = person(ctx, i)
    const sc = scenarioFor(ctx, p.child)
    const doctorId = ctx.staff[sc.doctor]
    const created = await ctx.owner.post<{ id: string }>('/patients', {
      fio: p.fio,
      phone: p.phone,
      birthDate: iso(p.birth),
      address: `Toshkent sh., ${pick(ctx, DISTRICTS)}`,
      doctorId,
    })
    patients.push({ id: created.id, fio: p.fio, doctor: sc.doctor, child: p.child })

    // Klinika oʻsib boryapti — yangi bemorlar soʻnggi oylarda koʻproq
    const back = 2 + Math.floor((span - 2) * ctx.rand() ** 1.6)
    let date = nextWorkday(daysFromToday(-back))
    await ctx.db
      .$executeRaw`UPDATE patients SET created_at = ${date} WHERE id = ${created.id}::uuid`
    let done = 0
    let debt = 0
    let last = date
    for (const step of sc.steps) {
      if (iso(date) >= iso(daysFromToday(0))) break
      debt += await visit(ctx, created.id, doctorId, date, step)
      last = date
      if (step.chart) {
        await ctx.owner.put(`/patients/${created.id}/teeth/${step.chart.tooth}`, {
          status: step.chart.status,
          material: step.chart.material ?? '',
        })
      }
      done++
      date = nextWorkday(new Date(date.getTime() + int(ctx, 4, 12) * 86_400_000))
    }

    // Qarzning koʻpi keyingi kelishda yopiladi — taqsimotsiz toʻlov eng eski
    // qarzdan yopadi
    const payday = new Date(last.getTime() + int(ctx, 5, 20) * 86_400_000)
    if (debt > 0 && payday < daysFromToday(0) && chance(ctx, 0.75)) {
      await ctx.owner.post('/payments', {
        patientId: created.id,
        date: iso(payday),
        amount: debt,
        note: 'Qarz toʻlandi',
      })
    }

    const finished = done === sc.steps.length
    if (!finished && sc.pending && done > 0) {
      await ctx.owner.put(`/patients/${created.id}/teeth/${sc.pending.tooth}`, {
        status: sc.pending.status,
      })
    }
    if (finished && sc.bridge) {
      await ctx.owner.post(`/patients/${created.id}/bridges`, {
        ...sc.bridge,
        material: 'metall-keramika',
      })
    }
    if (sc.caries) {
      await ctx.owner.put(`/patients/${created.id}/teeth/${sc.caries}`, { status: 'karies' })
    }
  }
  return patients
}

/// Tashrif va shu kungi toʻlov; qaytaradi — toʻlanmay qolgan summa
async function visit(
  ctx: Ctx,
  patientId: string,
  doctorId: string,
  date: Date,
  step: Step,
): Promise<number> {
  const s = ctx.services[step.service]
  if (!s) throw new Error(`Xizmat topilmadi: ${step.service}`)
  const day = iso(date)
  const duration = s.price >= 1_000_000 ? 60 : 30
  const start =
    ctx.slots.take(doctorId, day, duration, 9 * 60 + int(ctx, 0, 14) * 30) ??
    ctx.slots.take(doctorId, day, duration)
  const time = hm(start ?? 17 * 60)
  const body = {
    doctorId,
    time,
    treatment: s.name,
    serviceId: s.id,
    tooth: step.tooth,
    price: s.price,
    labCost: s.techPrice,
  }

  let visitId: string
  const recent = date.getTime() >= daysFromToday(-RECENT_DAYS).getTime()
  if (recent && start !== null) {
    const appt = await ctx.owner.post<{ id: string }>('/appointments', {
      patientId,
      doctorId,
      date: day,
      time,
      duration,
    })
    const res = await ctx.owner.post<{ visit: { id: string } }>(
      `/appointments/${appt.id}/complete`,
      body,
    )
    visitId = res.visit.id
  } else {
    const res = await ctx.owner.post<{ id: string }>('/visits', { ...body, patientId, date: day })
    visitId = res.id
  }

  // Koʻpchilik shu kuni toʻlaydi, bir qismi qisman, ozchiligi qarz boʻlib qoladi
  const r = ctx.rand()
  const part = Math.min(s.price, roundMoney(s.price * (0.4 + ctx.rand() * 0.4)))
  const amount = r < 0.85 ? s.price : r < 0.95 ? part : 0
  if (amount > 0 && s.price > 0) {
    await ctx.owner.post('/payments', {
      patientId,
      date: day,
      amount,
      allocations: [{ visitId, amount }],
    })
  }
  return s.price - amount
}
