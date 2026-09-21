/// Toʻlovning bogʻlangan ishi — «qaysi ish uchun»
export interface PaymentAllocation {
  visitId: string
  amount: number
  /// YYYY-MM-DD; tashrif oʻchirilgan boʻlsa boʻsh
  visitDate: string | null
  treatment: string | null
  tooth: number | null
}

export interface Payment {
  id: string
  patientId: string
  /// ISO: 2026-09-02T00:00:00.000Z
  date: string
  /// Soʻm, butun son
  amount: number
  note: string | null
  /// Kim qabul qildi. Eski yozuvlarda boʻsh
  createdByName: string | null
  /// Toʻlov oʻchirilmaydi — bekor qilinadi, sabab bilan. Bekor qilingani
  /// hisobga kirmaydi, roʻyxatda chizilgan holda turadi
  cancelledAt: string | null
  cancelledByName: string | null
  cancelReason: string | null
  allocations: PaymentAllocation[]
}

export interface Balance {
  charges: number
  paid: number
  /// Manfiy boʻlsa bemor oldindan toʻlagan
  debt: number
}
