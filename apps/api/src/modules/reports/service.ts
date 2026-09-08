// Hisobot. Oʻz jadvali yoʻq: boshqa modullarning xizmat qatlamidan jamlanma
// soʻraydi va oy kesimida birlashtiradi (tz.md 5-boʻlim, modul chegarasi).

import type { ExpenseCategory } from '../../../generated/prisma/client.js'
import type { Db } from '../../platform/db.js'
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

/// `created_at` esa aniq vaqt. Jarayonning TZ si Asia/Tashkent (platform/
/// timezone.ts tekshiradi), shuning uchun mahalliy yarim tun shu konstruktor
/// bilan chiqadi — oy chegarasi klinika kuni boʻyicha boʻladi
function localDay(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day)
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7)
}

function parseMonth(month: string): { year: number; index: number } {
  const [year, month1] = month.split('-').map(Number) as [number, number]
  return { year, index: month1 - 1 }
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

async function build(tx: ClinicTx, input: ReportInput): Promise<Report> {
  const { year, index } = parseMonth(input.month)

  // Grafik oynasi: tanlangan oy bilan tugaydigan 12 oy
  const windowFrom = utcDay(year, index - (MONTHS_SHOWN - 1), 1)
  const windowTo = utcDay(year, index + 1, 0)
  // Tanlangan oy
  const monthFrom = utcDay(year, index, 1)
  const monthTo = utcDay(year, index + 1, 0)

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
    const key = monthKey(utcDay(year, index - back, 1))
    months.push({
      month: key,
      charges: chargeSums.get(key) ?? 0,
      payments: paymentSums.get(key) ?? 0,
      expenses: expenseSums.get(key) ?? 0,
    })
  }

  const [topTreatments, topExpenses, newPatients] = await Promise.all([
    visits.topTreatmentsTx(tx, monthFrom, monthTo, TOP_ROWS),
    expenses.categoryTotalsTx(tx, monthFrom, monthTo, TOP_ROWS),
    patients.countCreatedTx(tx, localDay(year, index, 1), localDay(year, index + 1, 1)),
  ])

  const visitCount = visitDays
    .filter((row) => monthKey(row.date) === input.month)
    .reduce((sum, row) => sum + row.count, 0)

  const paid = paymentSums.get(input.month) ?? 0
  const spent = expenseSums.get(input.month) ?? 0

  return {
    months,
    summary: {
      visits: visitCount,
      charges: chargeSums.get(input.month) ?? 0,
      payments: paid,
      expenses: spent,
      profit: paid - spent,
      newPatients,
    },
    topTreatments,
    topExpenses,
  }
}

export function monthly(deps: ReportDeps, clinicId: string, input: ReportInput): Promise<Report> {
  return withClinic(deps.db, clinicId, (tx) => build(tx, input))
}
