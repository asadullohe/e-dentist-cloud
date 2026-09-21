// Ish haqi (tz.md 15-boʻlim). Oʻz jadvali 9.5 da (`staff_payouts`); hisobning
// oʻzi boshqa modullarning xizmat qatlamidan yigʻiladi: xodimlar va shartlar
// `auth` dan, tashriflar va ulush `visits` dan.
//
// Hisob = oylik + Σ tashrif ulushi. Ulush tashrifda snapshot, shuning uchun
// bu yerda foiz qayta koʻpaytirilmaydi — `doctor_share` yigʻiladi.
//
// Ulush **olingan puldan** (qaror 21/09/2026): tashrifga bogʻlangan toʻlovlar
// nisbatida — `share × olingan / narx`. Olinmagan qismi «kutilmoqda» —
// bemor toʻlaganda ish qilingan oyning hisobiga tushadi (oy tashrifniki,
// foiz oʻsha paytdagi snapshot).

import { formatMonth, PAYROLL_TEXT, shiftMonth } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as auth from '../auth/service.js'
import * as expenses from '../expenses/service.js'
import * as patients from '../patients/service.js'
import * as payments from '../payments/service.js'
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
  /// Bemorlardan olingan / olinmagan (oy ishlari boʻyicha)
  collected: number
  uncollected: number
  /// Texnik narxi (naryad va xizmatdan) — ulushdan ayirilgan
  labCost: number
  /// Joriy foiz (xodim kartasidan). Tashrifdagi snapshot bundan farq
  /// qilishi mumkin — «Qayta hisoblash» ularni tenglashtiradi
  percent: number
  /// Ulush — olingan qismdan; `pendingShare` — olinmagan qismga toʻgʻri
  /// keladigani, bemor toʻlaganda shu oyga tushadi
  share: number
  pendingShare: number
  salary: number
  total: number
  /// Shu oy uchun berilgan pul va qoldiq
  paid: number
  remaining: number
  payouts: Payout[]
}

export interface PayrollTotals {
  charges: number
  collected: number
  uncollected: number
  labCost: number
  share: number
  pendingShare: number
  salary: number
  total: number
  paid: number
  /// Klinikaga qolgan: olingan − shifokorlar ulushi − texnik − oyliklar
  clinic: number
}

export interface Payroll {
  month: string
  rows: PayrollRow[]
  totals: PayrollTotals
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
  labCost: number
  /// Olingan / olinmagan
  paid: number
  unpaid: number
  percent: number
  /// Toʻliq ulush (snapshot) va uning olingan qismi
  share: number
  sharePaid: number
}

/// Ulushning olingan qismi — toʻlov nisbatida, butun soʻmga
export function sharePaidOf(share: number, price: number, paid: number): number {
  if (price <= 0) return share
  return Math.round((share * Math.min(paid, price)) / price)
}

interface DoctorWork {
  count: number
  charges: number
  collected: number
  uncollected: number
  labCost: number
  share: number
  pendingShare: number
}

/// Oy tashriflari shifokor boʻyicha, olingan qism bilan
async function workByDoctor(
  tx: ClinicTx,
  from: Date,
  to: Date,
): Promise<Map<string | null, DoctorWork>> {
  const rows = await visits.listByMonthTx(tx, from, to)
  const paid = await payments.paidByVisitsTx(
    tx,
    rows.map((row) => row.id),
  )
  const result = new Map<string | null, DoctorWork>()
  for (const row of rows) {
    const work = result.get(row.doctorId) ?? {
      count: 0,
      charges: 0,
      collected: 0,
      uncollected: 0,
      labCost: 0,
      share: 0,
      pendingShare: 0,
    }
    const got = Math.min(paid.get(row.id) ?? 0, row.price)
    const sharePaid = sharePaidOf(row.doctorShare, row.price, got)
    work.count += 1
    work.charges += row.price
    work.collected += got
    work.uncollected += row.price - got
    work.labCost += row.labCost
    work.share += sharePaid
    work.pendingShare += row.doctorShare - sharePaid
    result.set(row.doctorId, work)
  }
  return result
}

/// `created_at` aniq vaqt, jarayon TZ si Asia/Tashkent — mahalliy oy olinadi
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
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
  const [staff, byDoctor, payouts] = await Promise.all([
    auth.listStaffTx(tx),
    workByDoctor(tx, from, to),
    payoutsByUser(tx, from),
  ])

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
      // Oylik hisob ochilgan oydan boshlab: bugun qoʻshilgan administratorga
      // oʻtgan yil uchun ham oylik chiqmasin
      const salary = monthKey(person.createdAt) <= month ? person.salaryAmount : 0
      const total = salary + share
      const own = payouts.get(person.id) ?? []
      const paid = own.reduce((acc, payout) => acc + payout.amount, 0)
      return {
        userId: person.id,
        fullName: person.fullName ?? '',
        roleName: person.roleName,
        status: person.status,
        visits: work?.count ?? 0,
        charges: work?.charges ?? 0,
        collected: work?.collected ?? 0,
        uncollected: work?.uncollected ?? 0,
        labCost: work?.labCost ?? 0,
        percent: person.payPercent,
        share,
        pendingShare: work?.pendingShare ?? 0,
        salary,
        total,
        paid,
        remaining: total - paid,
        payouts: own,
      }
    })

  const sum = (pick: (row: PayrollRow) => number) => rows.reduce((acc, row) => acc + pick(row), 0)
  const orphan = byDoctor.get(null)
  // Kassa taqsimoti — hamma tashriflar boʻyicha (shifokorsizlari ham),
  // faqat egasiga; shifokor oʻz qatorini koʻrganda umumiy son sir qoladi
  const all = [...byDoctor.values()]
  const total = (pick: (work: DoctorWork) => number) =>
    all.reduce((acc, work) => acc + pick(work), 0)
  const collected = viewer.manage ? total((w) => w.collected) : sum((row) => row.collected)
  const labCost = viewer.manage ? total((w) => w.labCost) : sum((row) => row.labCost)
  const share = sum((row) => row.share)
  const salary = sum((row) => row.salary)

  return {
    month,
    rows,
    totals: {
      charges: viewer.manage ? total((w) => w.charges) : sum((row) => row.charges),
      collected,
      uncollected: viewer.manage ? total((w) => w.uncollected) : sum((row) => row.uncollected),
      labCost,
      share,
      pendingShare: sum((row) => row.pendingShare),
      salary,
      total: sum((row) => row.total),
      paid: sum((row) => row.paid),
      clinic: collected - share - labCost - salary,
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
    const [people, paid] = await Promise.all([
      patients.findByIds(tx, [...new Set(rows.map((row) => row.patientId))]),
      payments.paidByVisitsTx(
        tx,
        rows.map((row) => row.id),
      ),
    ])
    const names = new Map(people.map((person) => [person.id, person.fio]))
    return rows.map((row) => {
      const got = Math.min(paid.get(row.id) ?? 0, row.price)
      return {
        id: row.id,
        date: row.date,
        patientId: row.patientId,
        patientName: names.get(row.patientId) ?? '',
        treatment: row.treatment,
        tooth: row.tooth,
        price: row.price,
        // Protez ishi: ulush (narx − texnik narxi) dan — shifokor buni koʻrsin
        labCost: row.labCost,
        paid: got,
        unpaid: row.price - got,
        percent: row.doctorPercent,
        share: row.doctorShare,
        sharePaid: sharePaidOf(row.doctorShare, row.price, got),
      }
    })
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

export interface PayrollExportRow {
  month: string
  fullName: string
  roleName: string | null
  visits: number
  charges: number
  collected: number
  uncollected: number
  percent: number
  share: number
  pendingShare: number
  salary: number
  total: number
  paid: number
  remaining: number
}

/// Boshqa modullar uchun (export): birinchi tashrif yoki toʻlovdan joriy
/// oygacha, oy × xodim. Boʻsh qatorlar (na ish, na oylik, na toʻlov) tushmaydi.
/// Ochiq tranzaksiya ichida
export async function exportRowsTx(tx: ClinicTx): Promise<PayrollExportRow[]> {
  const [firstVisit, firstPayout] = await Promise.all([visits.firstDateTx(tx), repo.firstMonth(tx)])
  const starts = [firstVisit, firstPayout]
    .filter((date): date is Date => date !== null)
    .map((date) => date.toISOString().slice(0, 7))
  if (starts.length === 0) return []

  const viewer: Viewer = { userId: '', manage: true }
  const rows: PayrollExportRow[] = []
  const last = monthKey(new Date())
  for (let month = starts.sort()[0] as string; month <= last; month = shiftMonth(month, 1)) {
    const payroll = await build(tx, month, viewer)
    for (const row of payroll.rows) {
      if (row.visits === 0 && row.total === 0 && row.paid === 0) continue
      rows.push({
        month,
        fullName: row.fullName,
        roleName: row.roleName,
        visits: row.visits,
        charges: row.charges,
        collected: row.collected,
        uncollected: row.uncollected,
        percent: row.percent,
        share: row.share,
        pendingShare: row.pendingShare,
        salary: row.salary,
        total: row.total,
        paid: row.paid,
        remaining: row.remaining,
      })
    }
  }
  return rows
}
