/// Bitta toʻlov. Summa va sana xarajatdan
export interface Payout {
  id: string
  expenseId: string
  /// YYYY-MM-DD
  date: string
  amount: number
  note: string
}

export interface PayrollRow {
  userId: string
  fullName: string
  roleName: string | null
  status: 'active' | 'disabled'
  visits: number
  /// Qilingan ish narxi, soʻm
  charges: number
  /// Bemorlardan olingan / olinmagan (oy ishlari boʻyicha)
  collected: number
  uncollected: number
  /// Texnik narxi — ulushdan ayirilgan
  labCost: number
  /// Joriy foiz (xodim kartasidan); tashrifdagi snapshot farq qilishi mumkin
  percent: number
  /// Ulush — olingan qismdan; `pendingShare` — bemor toʻlaganda tushadigani
  share: number
  pendingShare: number
  salary: number
  /// salary + share
  total: number
  /// Shu oy uchun berilgan pul va qoldiq
  paid: number
  remaining: number
  payouts: Payout[]
}

export interface Payroll {
  /// YYYY-MM
  month: string
  rows: PayrollRow[]
  totals: {
    charges: number
    collected: number
    uncollected: number
    labCost: number
    share: number
    pendingShare: number
    salary: number
    total: number
    paid: number
    /// Klinikaga qolgan: olingan − ulushlar − texnik − oyliklar
    clinic: number
  }
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
  /// Texnik narxi (naryaddan yoki xizmatdan) — ulush shundan keyingi qismidan
  labCost: number
  /// Olingan / olinmagan
  paid: number
  unpaid: number
  percent: number
  /// Toʻliq ulush (snapshot) va uning olingan qismi
  share: number
  sharePaid: number
}
