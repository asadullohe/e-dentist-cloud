import type { ExpenseCategory } from '@/entities/expense'

export interface ReportMonth {
  /// YYYY-MM
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
    /// Qoʻlga tushgan pul minus xarajat
    profit: number
    newPatients: number
  }
  topTreatments: { treatment: string; count: number; total: number }[]
  topExpenses: { category: ExpenseCategory; count: number; total: number }[]
}
