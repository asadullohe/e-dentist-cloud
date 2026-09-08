// payments moduli `payments` jadvaliga egalik qiladi.

import type { Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const SELECT = {
  id: true,
  patientId: true,
  date: true,
  amount: true,
  note: true,
} satisfies Prisma.PaymentSelect

export function list(tx: ClinicTx, patientId: string) {
  return tx.payment.findMany({
    where: { patientId },
    select: SELECT,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  })
}

export function create(
  tx: ClinicTx,
  id: string,
  data: { patientId: string; date: Date; amount: number; note?: string | null },
) {
  return tx.payment.create({ data: tenantScoped({ id, ...data }), select: SELECT })
}

export function update(tx: ClinicTx, id: string, data: Prisma.PaymentUpdateInput) {
  return tx.payment.update({ where: { id }, data, select: SELECT })
}

export function remove(tx: ClinicTx, id: string) {
  return tx.payment.delete({ where: { id } })
}

export async function paidTotals(tx: ClinicTx): Promise<Map<string, number>> {
  const rows = await tx.payment.groupBy({ by: ['patientId'], _sum: { amount: true } })
  return new Map(rows.map((row) => [row.patientId, row._sum.amount ?? 0]))
}

export async function paidTotalOf(tx: ClinicTx, patientId: string): Promise<number> {
  const row = await tx.payment.aggregate({ where: { patientId }, _sum: { amount: true } })
  return row._sum.amount ?? 0
}

/// Kun boʻyicha tushum. Oyga yigʻish xizmat qatlamida (visits bilan bir xil sabab)
export function dailyTotals(tx: ClinicTx, from: Date, to: Date) {
  return tx.payment.groupBy({
    by: ['date'],
    where: { date: { gte: from, lte: to } },
    _sum: { amount: true },
  })
}

/// Toʻliq eksport uchun
export function allPayments(tx: ClinicTx) {
  return tx.payment.findMany({ select: SELECT, orderBy: [{ date: 'asc' }, { id: 'asc' }] })
}
