export interface PayrollRow {
  userId: string
  fullName: string
  roleName: string | null
  status: 'active' | 'disabled'
  visits: number
  /// Qilingan ish narxi, soʻm
  charges: number
  /// Joriy foiz (xodim kartasidan); tashrifdagi snapshot farq qilishi mumkin
  percent: number
  share: number
  salary: number
  /// salary + share
  total: number
}

export interface Payroll {
  /// YYYY-MM
  month: string
  rows: PayrollRow[]
  totals: { charges: number; share: number; salary: number; total: number }
  /// Shifokori yoʻq tashriflar — faqat `payroll.manage` ga keladi
  unassigned: { visits: number; charges: number } | null
}

export interface PayrollVisit {
  id: string
  /// ISO sana
  date: string
  patientId: string
  patientName: string
  treatment: string
  tooth: number | null
  price: number
  percent: number
  share: number
}
