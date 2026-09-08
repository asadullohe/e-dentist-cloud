export interface Payment {
  id: string
  patientId: string
  /// ISO: 2026-09-02T00:00:00.000Z
  date: string
  /// Soʻm, butun son
  amount: number
  note: string | null
}

export interface Balance {
  charges: number
  paid: number
  /// Manfiy boʻlsa bemor oldindan toʻlagan
  debt: number
}
