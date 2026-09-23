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
  /// Davolash rejalari: nechta tuzildi va qanchasiga bemor rozi boʻldi (13.6)
  plans: PlanConversion
}

export interface PlanConversion {
  created: number
  accepted: number
  declined: number
  /// Qabul qilingan rejalarning toʻlanishi kerak boʻlgan summasi
  acceptedTotal: number
  byDoctor: {
    doctorId: string
    doctorName: string
    created: number
    accepted: number
    acceptedTotal: number
  }[]
}
