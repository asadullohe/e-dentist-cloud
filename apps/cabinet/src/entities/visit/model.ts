export interface Visit {
  id: string
  patientId: string
  /// Ishni qilgan shifokor. 9.1 dan oldingi yozuvlarda boʻsh
  doctorId: string | null
  doctorName: string | null
  /// ISO: 2026-09-01T00:00:00.000Z
  date: string
  /// «HH:MM»; eski yozuvlarda boʻsh
  time: string | null
  treatment: string
  tooth: number | null
  serviceId: string | null
  /// Soʻm, butun son
  price: number
  /// Naryad topshirilganda yozilgan tashrif — texnik narxi naryaddan
  labOrderId: string | null
  /// Texnik narxi (snapshot): naryaddan yoki xizmatdan; 0 — yoʻq
  labCost: number
  /// Bu ishga bogʻlangan toʻlovlar — olinmagan = narx − olingan
  paid: number
  note: string | null
}
