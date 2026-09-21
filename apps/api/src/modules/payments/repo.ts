// payments moduli `payments` va `payment_allocations` jadvallariga egalik qiladi.

import type { Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'

const SELECT = {
  id: true,
  patientId: true,
  date: true,
  amount: true,
  note: true,
  createdBy: true,
  cancelledAt: true,
  cancelledBy: true,
  cancelReason: true,
} satisfies Prisma.PaymentSelect

/// Hisob, qarzdorlar, hisobot — faqat amaldagi toʻlovlar
const ACTIVE = { cancelledAt: null } satisfies Prisma.PaymentWhereInput

export function list(tx: ClinicTx, patientId: string) {
  return tx.payment.findMany({
    where: { patientId },
    select: SELECT,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  })
}

export function findById(tx: ClinicTx, id: string) {
  return tx.payment.findUnique({ where: { id }, select: SELECT })
}

export function create(
  tx: ClinicTx,
  id: string,
  data: { patientId: string; date: Date; amount: number; note?: string | null; createdBy: string },
) {
  return tx.payment.create({ data: tenantScoped({ id, ...data }), select: SELECT })
}

export function update(tx: ClinicTx, id: string, data: Prisma.PaymentUpdateInput) {
  return tx.payment.update({ where: { id }, data, select: SELECT })
}

/// Oʻchirish yoʻq — bekor qilinadi (qaror 19/09/2026). Yozuv qoladi,
/// summalarga kirmaydi
export function cancel(
  tx: ClinicTx,
  id: string,
  data: { cancelledBy: string; cancelReason: string },
) {
  return tx.payment.update({
    where: { id },
    data: { ...data, cancelledAt: new Date() },
    select: SELECT,
  })
}

export async function paidTotals(tx: ClinicTx): Promise<Map<string, number>> {
  const rows = await tx.payment.groupBy({
    by: ['patientId'],
    where: ACTIVE,
    _sum: { amount: true },
  })
  return new Map(rows.map((row) => [row.patientId, row._sum.amount ?? 0]))
}

export async function paidTotalOf(tx: ClinicTx, patientId: string): Promise<number> {
  const row = await tx.payment.aggregate({
    where: { patientId, ...ACTIVE },
    _sum: { amount: true },
  })
  return row._sum.amount ?? 0
}

/// Kun boʻyicha tushum. Oyga yigʻish xizmat qatlamida (visits bilan bir xil sabab)
export function dailyTotals(tx: ClinicTx, from: Date, to: Date) {
  return tx.payment.groupBy({
    by: ['date'],
    where: { date: { gte: from, lte: to }, ...ACTIVE },
    _sum: { amount: true },
  })
}

/// Toʻliq eksport uchun
export function allPayments(tx: ClinicTx) {
  return tx.payment.findMany({ select: SELECT, orderBy: [{ date: 'asc' }, { id: 'asc' }] })
}

// ── Toʻlovning ishga bogʻlanishi ──

export interface AllocationInput {
  visitId: string
  amount: number
}

/// Bir nechta toʻlovning bogʻlanishlari (roʻyxat uchun)
export function allocationsOf(tx: ClinicTx, paymentIds: readonly string[]) {
  if (paymentIds.length === 0) return Promise.resolve([])
  return tx.paymentAllocation.findMany({
    where: { paymentId: { in: [...paymentIds] } },
    select: { paymentId: true, visitId: true, amount: true },
  })
}

/// Tashrif boʻyicha olingan summa — faqat amaldagi toʻlovlardan
export async function paidByVisits(
  tx: ClinicTx,
  visitIds: readonly string[],
): Promise<Map<string, number>> {
  if (visitIds.length === 0) return new Map()
  const rows = await tx.paymentAllocation.groupBy({
    by: ['visitId'],
    where: { visitId: { in: [...visitIds] }, payment: ACTIVE },
    _sum: { amount: true },
  })
  return new Map(rows.map((row) => [row.visitId, row._sum.amount ?? 0]))
}

/// Bemorning hamma tashriflari boʻyicha olingan — bogʻlash oldidan qolganini
/// bilish uchun. `exceptPaymentId` — qayta bogʻlanayotgan toʻlovning oʻzi
/// hisobga kirmasin
export async function paidByPatientVisits(
  tx: ClinicTx,
  patientId: string,
  exceptPaymentId?: string,
): Promise<Map<string, number>> {
  const rows = await tx.paymentAllocation.groupBy({
    by: ['visitId'],
    where: {
      payment: {
        patientId,
        ...ACTIVE,
        ...(exceptPaymentId ? { id: { not: exceptPaymentId } } : {}),
      },
    },
    _sum: { amount: true },
  })
  return new Map(rows.map((row) => [row.visitId, row._sum.amount ?? 0]))
}

export async function replaceAllocations(
  tx: ClinicTx,
  paymentId: string,
  rows: readonly AllocationInput[],
): Promise<void> {
  await tx.paymentAllocation.deleteMany({ where: { paymentId } })
  if (rows.length === 0) return
  await tx.paymentAllocation.createMany({
    data: rows.map((row) => tenantScoped({ id: uuidV7(), paymentId, ...row })),
  })
}
