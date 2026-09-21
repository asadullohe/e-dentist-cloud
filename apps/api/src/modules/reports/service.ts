// Hisobot. Oʻz jadvali yoʻq: boshqa modullarning xizmat qatlamidan jamlanma
// soʻraydi va oy kesimida birlashtiradi (tz.md 5-boʻlim, modul chegarasi).

import type { ExpenseCategory } from '../../../generated/prisma/client.js'
import type { Db } from '../../platform/db.js'
import { localDate, localDateAfter, utcDate } from '../../platform/period.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import * as expenses from '../expenses/service.js'
import * as patients from '../patients/service.js'
import * as payments from '../payments/service.js'
import * as visits from '../visits/service.js'
import type { ReportInput } from './schema.js'

export interface ReportDeps {
  db: Db
}

/// Grafikda koʻrsatiladigan oylar soni
const MONTHS_SHOWN = 12
const TOP_ROWS = 10

export interface ReportMonth {
  month: string
  charges: number
  payments: number
  expenses: number
}

export interface Report {
  months: ReportMonth[]
  summary: {
    visits: number
    charges: number
    payments: number
    expenses: number
    /// Qoʻlga tushgan pul minus xarajat. Qilingan ish narxi emas —
    /// hali toʻlanmagan ish foyda emas
    profit: number
    newPatients: number
  }
  topTreatments: { treatment: string; count: number; total: number }[]
  topExpenses: { category: ExpenseCategory; count: number; total: number }[]
}

/// DATE ustunlari UTC yarim tunda saqlanadi — chegaralar ham UTC da
function utcDay(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day))
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7)
}

/// Kunlik jamlanmani oy kalitlariga yigʻadi
function foldByMonth(rows: { date: Date; total: number }[]): Map<string, number> {
  const sums = new Map<string, number>()
  for (const row of rows) {
    const key = monthKey(row.date)
    sums.set(key, (sums.get(key) ?? 0) + row.total)
  }
  return sums
}

/// Davr ichidagi kunlar yigʻindisi (DATE ustuni — UTC kun)
function sumBetween(rows: { date: Date; total: number }[], from: Date, to: Date): number {
  return rows
    .filter((row) => row.date >= from && row.date <= to)
    .reduce((sum, row) => sum + row.total, 0)
}

async function build(tx: ClinicTx, input: ReportInput): Promise<Report> {
  // Davr chegaralari: DATE ustunlari uchun UTC kun
  const from = utcDate(input.from)
  const to = utcDate(input.to)

  // Grafik oynasi: davr oxiri tushgan oy bilan tugaydigan 12 oy. Davr
  // undan erta boshlansa (yil) — oyna boshi davr boshigacha kengayadi,
  // jamlanma toʻliq boʻlsin
  const endYear = to.getUTCFullYear()
  const endMonth = to.getUTCMonth()
  const chartFrom = utcDay(endYear, endMonth - (MONTHS_SHOWN - 1), 1)
  const windowFrom = from < chartFrom ? from : chartFrom
  const windowTo = utcDay(endYear, endMonth + 1, 0)

  const [visitDays, paymentDays, expenseDays] = await Promise.all([
    visits.dailyTotalsTx(tx, windowFrom, windowTo),
    payments.dailyTotalsTx(tx, windowFrom, windowTo),
    expenses.dailyTotalsTx(tx, windowFrom, windowTo),
  ])

  const chargeSums = foldByMonth(visitDays)
  const paymentSums = foldByMonth(paymentDays)
  const expenseSums = foldByMonth(expenseDays)

  const months: ReportMonth[] = []
  for (let back = MONTHS_SHOWN - 1; back >= 0; back--) {
    const key = monthKey(utcDay(endYear, endMonth - back, 1))
    months.push({
      month: key,
      charges: chargeSums.get(key) ?? 0,
      payments: paymentSums.get(key) ?? 0,
      expenses: expenseSums.get(key) ?? 0,
    })
  }

  const [topTreatments, topExpenses, newPatients] = await Promise.all([
    visits.topTreatmentsTx(tx, from, to, TOP_ROWS),
    expenses.categoryTotalsTx(tx, from, to, TOP_ROWS),
    // `created_at` aniq vaqt — chegaralar klinika kuni boʻyicha (mahalliy)
    patients.countCreatedTx(tx, localDate(input.from), localDateAfter(input.to)),
  ])

  const visitCount = visitDays
    .filter((row) => row.date >= from && row.date <= to)
    .reduce((sum, row) => sum + row.count, 0)

  const paid = sumBetween(paymentDays, from, to)
  const spent = sumBetween(expenseDays, from, to)

  return {
    months,
    summary: {
      visits: visitCount,
      charges: sumBetween(visitDays, from, to),
      payments: paid,
      expenses: spent,
      profit: paid - spent,
      newPatients,
    },
    topTreatments,
    topExpenses,
  }
}

export function period(deps: ReportDeps, clinicId: string, input: ReportInput): Promise<Report> {
  return withClinic(deps.db, clinicId, (tx) => build(tx, input))
}
