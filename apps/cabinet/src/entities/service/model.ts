import type { ServiceArea } from '@e-dentist/shared'

/// Xizmat turi — katalogning birinchi darajasi (Jarrohlik, Terapiya…)
export interface ServiceType {
  id: string
  name: string
  /// Klinika belgilagan tartib
  position: number
  serviceCount: number
}

export interface Service {
  id: string
  typeId: string
  typeName: string
  name: string
  /// Soʻm, butun son
  price: number
  /// Texnik narxi; null — texnik ishi yoʻq. Tashrifga snapshot boʻlib koʻchadi
  techPrice: number | null
  /// Nimaga qoʻllaniladi: tashrif va reja bandi shunga qarab tish soʻraydi
  area: ServiceArea
  /// Tur ichidagi tartib
  position: number
}
