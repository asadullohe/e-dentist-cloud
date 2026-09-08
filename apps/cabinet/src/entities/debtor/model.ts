export interface Debtor {
  patientId: string
  fio: string
  phone: string | null
  charges: number
  paid: number
  debt: number
}

export interface DebtorsPage {
  items: Debtor[]
  total: number
  /// Barcha qarzdorlar boʻyicha jami — sahifadagilar emas
  totalDebt: number
  page: number
  pageSize: number
}
