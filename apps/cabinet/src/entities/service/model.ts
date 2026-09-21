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
  /// Tur ichidagi tartib
  position: number
}
