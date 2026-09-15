// Ish haqi (tz.md 15-boʻlim). Oʻz jadvali 9.5 da (`staff_payouts`); hisobning
// oʻzi boshqa modullarning xizmat qatlamidan yigʻiladi: xodimlar va shartlar
// `auth` dan, tashriflar va ulush `visits` dan.
//
// Hisob = oylik + Σ tashrif ulushi. Ulush tashrifda snapshot, shuning uchun
// bu yerda foiz qayta koʻpaytirilmaydi — `doctor_share` yigʻiladi.

import { formatMonth, PAYROLL_TEXT } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as auth from '../auth/service.js'
import * as expenses from '../expenses/service.js'
import * as patients from '../patients/service.js'
import * as visits from '../visits/service.js'
import * as repo from './repo.js'
import type {
  PayoutCreateInput,
  PayrollInput,
  PayrollVisitsInput,
  RecalculateInput,
} from './schema.js'

export interface PayrollDeps {
  db: Db
}

/// Kim soʻrayapti: `payroll.manage` — hamma, `payroll.own` — faqat oʻzi
export interface Viewer {
  userId: string
  manage: boolean
}

/// Bitta toʻlov. Summa va sana xarajatdan
export interface Payout {
  id: string
  expenseId: string
  /// YYYY-MM-DD
  date: string
  amount: number
  note: string
}

export interface PayrollRow {
  userId: string
  fullName: string
  roleName: string | null
  status: 'active' | 'disabled'
  visits: number
  charges: number
  /// Joriy foiz (xodim kartasidan). Tashrifdagi snapshot bundan farq
  /// qilishi mumkin — «Qayta hisoblash» ularni tenglashtiradi
  percent: number
  share: number
  salary: number
  total: number
  /// Shu oy uchun berilgan pul va qoldiq
  paid: number
  remaining: number
  payouts: Payout[]
}

export interface Payroll {
  month: string
  rows: PayrollRow[]
  totals: { charges: number; share: number; salary: number; total: number; paid: number }
  /// Shifokori yoʻq tashriflar (9.1 dan oldingi yozuvlar). Faqat egasiga
  unassigned: { visits: number; charges: number } | null
}

export interface PayrollVisit {
  id: string
  date: Date
  patientId: string
  patientName: string
  treatment: string
  tooth: number | null
  price: number
  percent: number
  share: number
}

/// DATE ustunlari UTC yarim tunda — chegaralar ham UTC da (reports bilan bir xil)
export function monthRange(month: string): { from: Date; to: Date } {
  const [year, index] = month.split('-').map(Number) as [number, number]
  return {
    from: new Date(Date.UTC(year, index - 1, 1)),
    to: new Date(Date.UTC(year, index, 0)),
  }
}

/// Oyning toʻlovlari xodim boʻyicha, xarajatdan summa va sana bilan
async function payoutsByUser(tx: ClinicTx, month: Date): Promise<Map<string, Payout[]>> {
  const links = await repo.listByMonth(tx, month)
  const rows = await expenses.findByIdsTx(
    tx,
    links.map((link) => link.expenseId),
  )
  const byExpense = new Map(rows.map((row) => [row.id, row]))

  const result = new Map<string, Payout[]>()
  for (const link of links) {
    const expense = byExpense.get(link.expenseId)
    if (!expense) continue
    const list = result.get(link.userId) ?? []
    list.push({
      id: link.id,
      expenseId: expense.id,
      date: expense.date,
      amount: expense.amount,
      note: expense.description,
    })
    result.set(link.userId, list)
  }
  return result
}

async function build(tx: ClinicTx, month: string, viewer: Viewer): Promise<Payroll> {
  const { from, to } = monthRange(month)
  const [staff, totals, payouts] = await Promise.all([
    auth.listStaffTx(tx),
    visits.doctorTotalsTx(tx, from, to),
    payoutsByUser(tx, from),
  ])
  const byDoctor = new Map(totals.map((row) => [row.doctorId, row]))

  // Faol xodimlar hammasi; faolsizlantirilgani — faqat shu oyda ishi yoki
  // toʻlovi boʻlsa (ishdan ketgan shifokorning oxirgi oyi tushib qolmasin)
  const rows: PayrollRow[] = staff
    .filter(
      (person) => person.status === 'active' || byDoctor.has(person.id) || payouts.has(person.id),
    )
    .filter((person) => viewer.manage || person.id === viewer.userId)
    .map((person) => {
      const work = byDoctor.get(person.id)
      const share = work?.share ?? 0
      const total = person.salaryAmount + share
      const own = payouts.get(person.id) ?? []
      const paid = own.reduce((acc, payout) => acc + payout.amount, 0)
      return {
        userId: person.id,
        fullName: person.fullName ?? '',
        roleName: person.roleName,
        status: person.status,
        visits: work?.count ?? 0,
        charges: work?.charges ?? 0,
        percent: person.payPercent,
        share,
        salary: person.salaryAmount,
        total,
        paid,
        remaining: total - paid,
        payouts: own,
      }
    })

  const sum = (pick: (row: PayrollRow) => number) => rows.reduce((acc, row) => acc + pick(row), 0)
  const orphan = byDoctor.get(null)

  return {
    month,
    rows,
    totals: {
      charges: sum((row) => row.charges),
      share: sum((row) => row.share),
      salary: sum((row) => row.salary),
      total: sum((row) => row.total),
      paid: sum((row) => row.paid),
    },
    unassigned: viewer.manage && orphan ? { visits: orphan.count, charges: orphan.charges } : null,
  }
}

export function monthly(
  deps: PayrollDeps,
  clinicId: string,
  viewer: Viewer,
  input: PayrollInput,
): Promise<Payroll> {
  return withClinic(deps.db, clinicId, (tx) => build(tx, input.month, viewer))
}

/// Xodimning oydagi ishlari — bemor ismi bilan. `payroll.own` faqat oʻzinikini
/// soʻray oladi: begona id berilsa 403, «yoʻq» emas — bor-yoʻqligi ham sir
export function visitsOf(
  deps: PayrollDeps,
  clinicId: string,
  viewer: Viewer,
  input: PayrollVisitsInput,
): Promise<PayrollVisit[]> {
  const userId = input.userId ?? viewer.userId
  if (!viewer.manage && userId !== viewer.userId) throw errors.forbidden()

  return withClinic(deps.db, clinicId, async (tx) => {
    const { from, to } = monthRange(input.month)
    const rows = await visits.listByDoctorTx(tx, userId, from, to)
    const people = await patients.findByIds(tx, [...new Set(rows.map((row) => row.patientId))])
    const names = new Map(people.map((person) => [person.id, person.fio]))
    return rows.map((row) => ({
      id: row.id,
      date: row.date,
      patientId: row.patientId,
      patientName: names.get(row.patientId) ?? '',
      treatment: row.treatment,
      tooth: row.tooth,
      price: row.price,
      percent: row.doctorPercent,
      share: row.doctorShare,
    }))
  })
}

/// Oydagi tashriflarga xodimning joriy foizini qayta yozish. Snapshot
/// qoidasidan aniq chekinish: egasi avval tashriflarni yozib, keyin foiz
/// qoʻygan boʻlsa — shu tugma. Audit yozuvi qoladi
export function recalculate(
  deps: PayrollDeps,
  clinicId: string,
  actorId: string,
  input: RecalculateInput,
): Promise<{ count: number; percent: number }> {
  return withClinic(deps.db, clinicId, async (tx) => {
    if (!(await auth.existsInClinic(tx, input.userId))) {
      throw errors.notFound(PAYROLL_TEXT.staff_not_found)
    }
    const { payPercent } = await auth.payTermsTx(tx, input.userId)
    const { from, to } = monthRange(input.month)
    const count = await visits.recalculateSharesTx(tx, input.userId, from, to, payPercent)
    await writeAudit(tx, {
      userId: actorId,
      action: AUDIT_ACTION.payroll_recalculated,
      entity: 'user',
      entityId: input.userId,
      meta: { month: input.month, percent: payPercent, count },
    })
    return { count, percent: payPercent }
  })
}

/// Toʻlab berish: xarajat (`salary` turkumi) va bogʻlanish bir tranzaksiyada —
/// biri yozilib, ikkinchisi qolib ketmasin (naryad → xarajat andozasi)
export function createPayout(
  deps: PayrollDeps,
  clinicId: string,
  actorId: string,
  input: PayoutCreateInput,
): Promise<Payout> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const person = await auth.findStaffNameTx(tx, input.userId)
    if (!person) throw errors.notFound(PAYROLL_TEXT.staff_not_found)

    const note = input.note?.trim()
    const expense = await expenses.addTx(tx, {
      date: new Date(`${input.date}T00:00:00Z`),
      category: 'salary',
      description: note || PAYROLL_TEXT.expense_note(person, formatMonth(input.month)),
      amount: input.amount,
    })
    const link = await repo.create(tx, uuidV7(), {
      userId: input.userId,
      month: monthRange(input.month).from,
      expenseId: expense.id,
    })
    await writeAudit(tx, {
      userId: actorId,
      action: AUDIT_ACTION.payout_created,
      entity: 'user',
      entityId: input.userId,
      meta: { month: input.month, amount: input.amount, expenseId: expense.id },
    })
    return {
      id: link.id,
      expenseId: expense.id,
      date: expense.date,
      amount: expense.amount,
      note: expense.description,
    }
  })
}

/// Toʻlovni oʻchirish — xarajati bilan. Bogʻlanish xarajat ortidan
/// kaskad bilan oʻzi ketadi
export function removePayout(
  deps: PayrollDeps,
  clinicId: string,
  actorId: string,
  id: string,
): Promise<void> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const link = await repo.find(tx, id)
    if (!link) throw errors.notFound(PAYROLL_TEXT.payout_not_found)
    await expenses.removeTx(tx, link.expenseId)
    await writeAudit(tx, {
      userId: actorId,
      action: AUDIT_ACTION.payout_deleted,
      entity: 'user',
      entityId: link.userId,
      meta: { payoutId: id, expenseId: link.expenseId },
    })
  })
}
