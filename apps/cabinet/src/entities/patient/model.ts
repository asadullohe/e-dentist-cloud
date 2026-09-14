export interface Patient {
  id: string
  fio: string
  phone: string | null
  /// ISO: 1990-05-12T00:00:00.000Z
  birthDate: string | null
  address: string | null
  note: string | null
  createdAt: string
}

export interface PatientPage {
  items: Patient[]
  total: number
  page: number
  pageSize: number
}

export type PatientSort = 'fio' | 'birthDate' | 'createdAt'

export interface PatientQuery {
  q?: string
  page?: number
  pageSize?: number
  sort?: PatientSort
  dir?: 'asc' | 'desc'
}
