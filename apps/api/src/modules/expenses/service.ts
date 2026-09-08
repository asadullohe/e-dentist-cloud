// Xarajatlar. Hisobotdagi sof foyda shu jadvalga tayanadi (tz.md 9-boʻlim).

import { EXPENSE_TEXT } from '@e-dentist/shared'
import type { ExpenseCategory } from '../../../generated/prisma/client.js'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as repo from './repo.js'
import type { ExpenseCreateInput, ExpenseListInput, ExpenseUpdateInput } from './schema.js'

export interface ExpenseDeps {
  db: Db
}

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  description: string
  amount: number
}

export interface ExpenseMonth {
  items: Expense[]
  total: number
  byCategory: { category: ExpenseCategory; total: number }[]
}

/// `YYYY-MM-DD` → DATE ustuni uchun UTC yarim tuni (patients moduli bilan
/// bir xil sabab: mahalliy yarim tun kunni bir kun orqaga suradi)
function toDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/// `YYYY-MM` → oyning birinchi va oxirgi kuni
function monthRange(month: string): { from: Date; to: Date } {
  const [year, index] = month.split('-').map(Number) as [number, number]
  return {
    from: new Date(Date.UTC(year, index - 1, 1)),
    to: new Date(Date.UTC(year, index, 0)),
  }
}

function toApi(row: {
  id: string
  date: Date
  category: ExpenseCategory
  description: string
  amount: number
}): Expense {
  return { ...row, date: toIso(row.date) }
}

function code(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined
}

function notFound(error: unknown): never {
  if (code(error) === 'P2025') throw errors.notFound(EXPENSE_TEXT.not_found)
  throw error
}

/// Roʻyxat va jamlanma bitta javobda: sahifa ikkalasini birga koʻrsatadi,
/// oy boʻyicha yozuvlar kam — jamlanma xotirada sanaladi
export function listMonth(
  deps: ExpenseDeps,
  clinicId: string,
  input: ExpenseListInput,
): Promise<ExpenseMonth> {
  const { from, to } = monthRange(input.month)
  return withClinic(deps.db, clinicId, async (tx) => {
    const rows = await repo.listBetween(tx, from, to)

    const sums = new Map<ExpenseCategory, number>()
    let total = 0
    for (const row of rows) {
      total += row.amount
      sums.set(row.category, (sums.get(row.category) ?? 0) + row.amount)
    }

    return {
      items: rows.map(toApi),
      total,
      byCategory: [...sums]
        .map(([category, sum]) => ({ category, total: sum }))
        .sort((a, b) => b.total - a.total),
    }
  })
}

/// Boshqa modullar uchun: naryad topshirilganda texnik narxi xarajatga
/// tushadi (bosqich 3.6). `lab` moduli `expenses` jadvaliga oʻzi tegmaydi
export function addTx(
  tx: ClinicTx,
  data: { date: Date; category: ExpenseCategory; description: string; amount: number },
): Promise<Expense> {
  return repo.create(tx, uuidV7(), data).then(toApi)
}

/// Boshqa modullar uchun (reports): kun boʻyicha xarajat
export async function dailyTotalsTx(
  tx: ClinicTx,
  from: Date,
  to: Date,
): Promise<{ date: Date; total: number }[]> {
  const rows = await repo.dailyTotals(tx, from, to)
  return rows.map((row) => ({ date: row.date, total: row._sum.amount ?? 0 }))
}

/// Boshqa modullar uchun (reports): turkum boʻyicha jamlanma
export async function categoryTotalsTx(
  tx: ClinicTx,
  from: Date,
  to: Date,
  take: number,
): Promise<{ category: ExpenseCategory; count: number; total: number }[]> {
  const rows = await repo.categoryTotals(tx, from, to, take)
  return rows.map((row) => ({
    category: row.category,
    count: row._count._all,
    total: row._sum.amount ?? 0,
  }))
}

export function create(
  deps: ExpenseDeps,
  clinicId: string,
  userId: string,
  input: ExpenseCreateInput,
): Promise<Expense> {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    const created = await repo.create(tx, id, {
      date: toDate(input.date),
      category: input.category as ExpenseCategory,
      description: input.description,
      amount: input.amount,
    })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.expense_changed,
      entity: 'expense',
      entityId: id,
    })
    return toApi(created)
  })
}

export function update(
  deps: ExpenseDeps,
  clinicId: string,
  userId: string,
  id: string,
  input: ExpenseUpdateInput,
): Promise<Expense> {
  return withClinic(deps.db, clinicId, async (tx) => {
    let updated: Awaited<ReturnType<typeof repo.update>>
    try {
      updated = await repo.update(tx, id, {
        ...(input.date === undefined ? {} : { date: toDate(input.date) }),
        ...(input.category === undefined ? {} : { category: input.category as ExpenseCategory }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.amount === undefined ? {} : { amount: input.amount }),
      })
    } catch (error) {
      notFound(error)
    }
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.expense_changed,
      entity: 'expense',
      entityId: id,
    })
    return toApi(updated)
  })
}

export function remove(
  deps: ExpenseDeps,
  clinicId: string,
  userId: string,
  id: string,
): Promise<void> {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      await repo.remove(tx, id)
    } catch (error) {
      notFound(error)
    }
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.expense_changed,
      entity: 'expense',
      entityId: id,
    })
  })
}

/// Toʻliq eksport uchun (export moduli)
export function exportExpensesTx(tx: ClinicTx) {
  return repo.allExpenses(tx)
}
