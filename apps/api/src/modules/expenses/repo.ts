// expenses moduli `expenses` jadvaliga egalik qiladi.

import type { ExpenseCategory, Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const SELECT = {
  id: true,
  date: true,
  category: true,
  description: true,
  amount: true,
} satisfies Prisma.ExpenseSelect

export interface ExpenseRow {
  date: Date
  category: ExpenseCategory
  description: string
  amount: number
}

export function listBetween(tx: ClinicTx, from: Date, to: Date) {
  return tx.expense.findMany({
    where: { date: { gte: from, lte: to } },
    select: SELECT,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  })
}

export function create(tx: ClinicTx, id: string, data: ExpenseRow) {
  return tx.expense.create({ data: tenantScoped({ id, ...data }), select: SELECT })
}

export function update(tx: ClinicTx, id: string, data: Prisma.ExpenseUpdateInput) {
  return tx.expense.update({ where: { id }, data, select: SELECT })
}

export function remove(tx: ClinicTx, id: string) {
  return tx.expense.delete({ where: { id } })
}
