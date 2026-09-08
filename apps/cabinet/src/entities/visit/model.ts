export interface Visit {
  id: string
  patientId: string
  /// ISO: 2026-09-01T00:00:00.000Z
  date: string
  treatment: string
  tooth: number | null
  serviceId: string | null
  /// Soʻm, butun son
  price: number
  note: string | null
}
