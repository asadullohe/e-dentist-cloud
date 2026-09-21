// Toʻlovlar va qarzdorlik.
//
// Qarz alohida ustunda saqlanmaydi: u tashriflar va toʻlovlar farqidan
// hisoblanadi. Ikki joyda turgan son ertami-kechmi bir-biridan ajralib
// qoladi (tz.md 5-boʻlim).

import { PATIENT_TEXT, PAYMENT_TEXT } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import type { ScopedViewer } from '../../platform/guards.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as auth from '../auth/service.js'
import * as patients from '../patients/service.js'
import * as visits from '../visits/service.js'
import * as repo from './repo.js'
import type {
  AllocationsInput,
  DebtorsInput,
  PaymentCancelInput,
  PaymentCreateInput,
  PaymentUpdateInput,
} from './schema.js'

export interface PaymentDeps {
  db: Db
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

/// Bemor shu klinikaniki va koʻruvchiga koʻrinadi: shifokor (patients.all
/// yoʻq) boshqaning bemori hisobini koʻrmaydi, toʻlov ham yozolmaydi
async function assertPatient(tx: ClinicTx, viewer: ScopedViewer, patientId: string): Promise<void> {
  if (!(await patients.isVisibleTx(tx, viewer, patientId))) {
    throw errors.notFound(PATIENT_TEXT.not_found)
  }
}

type PaymentRow = Awaited<ReturnType<typeof repo.list>>[number]

/// Toʻlovning bogʻlangan ishi — roʻyxatda «qaysi ish uchun» koʻrinadi
export interface Allocation {
  visitId: string
  amount: number
  /// YYYY-MM-DD; tashrif oʻchirilgan boʻlsa boʻsh
  visitDate: string | null
  treatment: string | null
  tooth: number | null
}

/// Roʻyxatdagi qator: kim qabul qilgani va (bekor qilingan boʻlsa) kim bekor
/// qilgani ismlar bilan — xodimlar boshqa modulniki, ismlar servisidan olinadi
export interface Payment extends PaymentRow {
  createdByName: string | null
  cancelledByName: string | null
  allocations: Allocation[]
}

const isoOf = (date: Date) => date.toISOString().slice(0, 10)

async function withNames(tx: ClinicTx, rows: PaymentRow[]): Promise<Payment[]> {
  const ids = new Set<string>()
  for (const row of rows) {
    if (row.createdBy) ids.add(row.createdBy)
    if (row.cancelledBy) ids.add(row.cancelledBy)
  }
  const [names, allocationRows] = await Promise.all([
    auth.staffNamesTx(tx, [...ids]),
    repo.allocationsOf(
      tx,
      rows.map((row) => row.id),
    ),
  ])
  const summaries = new Map(
    (await visits.summariesTx(tx, [...new Set(allocationRows.map((a) => a.visitId))])).map(
      (v) => [v.id, v] as const,
    ),
  )
  return rows.map((row) => ({
    ...row,
    createdByName: row.createdBy ? (names.get(row.createdBy) ?? null) : null,
    cancelledByName: row.cancelledBy ? (names.get(row.cancelledBy) ?? null) : null,
    allocations: allocationRows
      .filter((a) => a.paymentId === row.id)
      .map((a) => {
        const v = summaries.get(a.visitId)
        return {
          visitId: a.visitId,
          amount: a.amount,
          visitDate: v ? isoOf(v.date) : null,
          treatment: v?.treatment ?? null,
          tooth: v?.tooth ?? null,
        }
      }),
  }))
}

/// Boshqa modullar uchun (visits, payroll): tashrif boʻyicha olingan summa
export function paidByVisitsTx(tx: ClinicTx, visitIds: readonly string[]) {
  return repo.paidByVisits(tx, visitIds)
}

export async function paidOfVisitTx(tx: ClinicTx, visitId: string): Promise<number> {
  return (await repo.paidByVisits(tx, [visitId])).get(visitId) ?? 0
}

/// Toʻlovni ishlarga bogʻlash. Aniq roʻyxat berilsa tekshiriladi: ish shu
/// bemorniki, bir ish bir marta, ishga qolganidan koʻp emas, jami toʻlovdan
/// koʻp emas. Berilmasa — eng eski yopilmagan ishdan boshlab avtomat;
/// ortib qolgani bogʻlanmay qoladi (avans)
async function allocate(
  tx: ClinicTx,
  payment: { id: string; patientId: string; amount: number },
  explicit: readonly { visitId: string; amount: number }[] | undefined,
): Promise<void> {
  const [own, paid] = await Promise.all([
    visits.forAllocationTx(tx, payment.patientId),
    repo.paidByPatientVisits(tx, payment.patientId, payment.id),
  ])
  const remainingOf = (visit: { id: string; price: number }) =>
    Math.max(0, visit.price - (paid.get(visit.id) ?? 0))

  if (explicit === undefined) {
    const rows: repo.AllocationInput[] = []
    let left = payment.amount
    for (const visit of own) {
      if (left <= 0) break
      const amount = Math.min(left, remainingOf(visit))
      if (amount <= 0) continue
      rows.push({ visitId: visit.id, amount })
      left -= amount
    }
    await repo.replaceAllocations(tx, payment.id, rows)
    return
  }

  const byId = new Map(own.map((visit) => [visit.id, visit]))
  const seen = new Set<string>()
  let total = 0
  for (const row of explicit) {
    const visit = byId.get(row.visitId)
    if (!visit) throw errors.validation({ allocations: PAYMENT_TEXT.allocation_visit })
    if (seen.has(row.visitId))
      throw errors.validation({ allocations: PAYMENT_TEXT.allocation_duplicate })
    seen.add(row.visitId)
    if (row.amount > remainingOf(visit))
      throw errors.validation({
        allocations: PAYMENT_TEXT.allocation_over_visit(visit.treatment),
      })
    total += row.amount
  }
  if (total > payment.amount)
    throw errors.validation({ allocations: PAYMENT_TEXT.allocation_exceeds })
  await repo.replaceAllocations(tx, payment.id, explicit)
}

export function list(deps: PaymentDeps, clinicId: string, viewer: ScopedViewer, patientId: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, viewer, patientId)
    return withNames(tx, await repo.list(tx, patientId))
  })
}

/// Boshqa modullar uchun (reports): kun boʻyicha tushum
export async function dailyTotalsTx(
  tx: ClinicTx,
  from: Date,
  to: Date,
): Promise<{ date: Date; total: number }[]> {
  const rows = await repo.dailyTotals(tx, from, to)
  return rows.map((row) => ({ date: row.date, total: row._sum.amount ?? 0 }))
}

/// Bemorning hisobi. Qarz manfiy boʻlsa — oldindan toʻlangan
export function balance(
  deps: PaymentDeps,
  clinicId: string,
  viewer: ScopedViewer,
  patientId: string,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, viewer, patientId)
    const [charges, paid] = await Promise.all([
      visits.chargeTotalOf(tx, patientId),
      repo.paidTotalOf(tx, patientId),
    ])
    return { charges, paid, debt: charges - paid }
  })
}

export function create(
  deps: PaymentDeps,
  clinicId: string,
  viewer: ScopedViewer,
  input: PaymentCreateInput,
) {
  const { userId } = viewer
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, viewer, input.patientId)

    const payment = await repo.create(tx, id, {
      patientId: input.patientId,
      date: toDate(input.date),
      amount: input.amount,
      note: input.note ?? null,
      createdBy: userId,
    })
    await allocate(tx, payment, input.allocations)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.payment_created,
      entity: 'payment',
      entityId: id,
      meta: { patientId: input.patientId, amount: input.amount },
    })
    const [row] = await withNames(tx, [payment])
    return row as Payment
  })
}

/// Faqat izoh. Summa va sana oʻzgarmas — xato boʻlsa bekor qilib, yangisi
/// kiritiladi (qaror 19/09/2026: pul yozuvi keyin «tuzatilmasin»)
export function update(
  deps: PaymentDeps,
  clinicId: string,
  userId: string,
  id: string,
  input: PaymentUpdateInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const existing = await repo.findById(tx, id)
    if (!existing) throw errors.notFound(PAYMENT_TEXT.not_found)
    if (existing.cancelledAt) throw errors.conflict(PAYMENT_TEXT.cancelled_immutable)

    const payment = await repo.update(tx, id, {
      ...(input.note === undefined ? {} : { note: input.note }),
    })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.payment_updated,
      entity: 'payment',
      entityId: id,
    })
    const [row] = await withNames(tx, [payment])
    return row as Payment
  })
}

/// Bekor qilish — oʻchirish oʻrniga. Yozuv roʻyxatda qoladi (kim, qachon,
/// nima uchun), hisobga va qarzdorlarga kirmaydi. Ikki marta bekor qilib
/// boʻlmaydi
export function cancel(
  deps: PaymentDeps,
  clinicId: string,
  userId: string,
  id: string,
  input: PaymentCancelInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const existing = await repo.findById(tx, id)
    if (!existing) throw errors.notFound(PAYMENT_TEXT.not_found)
    if (existing.cancelledAt) throw errors.conflict(PAYMENT_TEXT.already_cancelled)

    const payment = await repo.cancel(tx, id, { cancelledBy: userId, cancelReason: input.reason })
    // Bekor qilingan toʻlov hech qaysi ishni yopmaydi
    await repo.replaceAllocations(tx, id, [])
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.payment_cancelled,
      entity: 'payment',
      entityId: id,
      meta: { patientId: existing.patientId, amount: existing.amount, reason: input.reason },
    })
    const [row] = await withNames(tx, [payment])
    return row as Payment
  })
}

/// Bogʻlanishni keyin oʻrnatish yoki oʻzgartirish — avans toʻlovni ishga
/// yozish, xato bogʻlanishni tuzatish. Roʻyxat toʻliq almashadi
export function setAllocations(
  deps: PaymentDeps,
  clinicId: string,
  viewer: ScopedViewer,
  id: string,
  input: AllocationsInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const existing = await repo.findById(tx, id)
    if (!existing) throw errors.notFound(PAYMENT_TEXT.not_found)
    await assertPatient(tx, viewer, existing.patientId)
    if (existing.cancelledAt) throw errors.conflict(PAYMENT_TEXT.cancelled_immutable)
    await allocate(tx, existing, input.allocations)
    await writeAudit(tx, {
      userId: viewer.userId,
      action: AUDIT_ACTION.payment_updated,
      entity: 'payment',
      entityId: id,
      meta: { allocations: input.allocations.length },
    })
    const [row] = await withNames(tx, [existing])
    return row as Payment
  })
}

export interface Debtor {
  patientId: string
  fio: string
  phone: string | null
  charges: number
  paid: number
  debt: number
}

/// Qarzdorlar roʻyxati.
///
/// Uch modulning maʼlumoti kerak, shuning uchun har biri oʻz servisidan
/// soʻraladi va birlashtirish shu yerda boʻladi. Bitta SQL bilan qilish
/// tezroq boʻlardi, lekin modul chegarasini buzardi — klinikada bemorlar
/// soni mingdan oshmaydi, bu hajmda farq sezilmaydi
export function debtors(
  deps: PaymentDeps,
  clinicId: string,
  viewer: ScopedViewer,
  input: DebtorsInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const [charges, paid, matching, visible] = await Promise.all([
      visits.chargeTotals(tx),
      repo.paidTotals(tx),
      input.q ? patients.searchIds(tx, input.q) : null,
      // Shifokor faqat oʻz bemorlarining qarzini koʻradi
      patients.visibleIdsTx(tx, viewer),
    ])

    const all: Omit<Debtor, 'fio' | 'phone'>[] = []
    for (const [patientId, charged] of charges) {
      if (matching && !matching.has(patientId)) continue
      if (visible && !visible.has(patientId)) continue
      const paidSum = paid.get(patientId) ?? 0
      const debt = charged - paidSum
      if (debt > 0) all.push({ patientId, charges: charged, paid: paidSum, debt })
    }
    const sign = input.dir === 'asc' ? 1 : -1
    // Ikkinchi kalit — bemor id si: teng summalarda sahifalar orasida qator
    // sakrab yurmasin
    all.sort(
      (a, b) => sign * (a[input.sort] - b[input.sort]) || (a.patientId < b.patientId ? -1 : 1),
    )

    const totalDebt = all.reduce((sum, row) => sum + row.debt, 0)
    const page = all.slice((input.page - 1) * input.pageSize, input.page * input.pageSize)

    const people = await patients.findByIds(
      tx,
      page.map((row) => row.patientId),
    )
    const byId = new Map(people.map((person) => [person.id, person]))

    const items: Debtor[] = page.map((row) => ({
      ...row,
      fio: byId.get(row.patientId)?.fio ?? '',
      phone: byId.get(row.patientId)?.phone ?? null,
    }))

    return { items, total: all.length, totalDebt, page: input.page, pageSize: input.pageSize }
  })
}

/// Toʻliq eksport uchun (export moduli)
export function exportPaymentsTx(tx: ClinicTx) {
  return repo.allPayments(tx)
}
