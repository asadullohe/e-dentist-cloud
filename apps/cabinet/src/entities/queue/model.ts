export type QueueStatus = 'unconfirmed' | 'waiting' | 'called' | 'finished'

export interface QueueDoctor {
  id: string
  fullName: string
  /// Navbatda turgan (tasdiqlangan) odamlar soni
  waiting: number
  waitMinutes: number
}

export interface QueueBoard {
  clinicName: string
  /// Rasmning oʻzi alohida manzilda: clinicLogoUrl(kod)
  hasLogo: boolean
  doctors: QueueDoctor[]
}

export interface QueueTicket {
  id: string
  number: number
  ahead: number
  status: QueueStatus
  doctorName: string
  waitMinutes: number
}

export interface QueueScreen {
  clinicName: string
  hasLogo: boolean
  /// Hozir chaqirilganlar. Ismlar yoʻq — faqat raqam va shifokor
  called: { number: number; doctorName: string }[]
  next: number[]
}

/// Kabinetdagi navbat qatori — bu yerda ismlar koʻrinadi
export interface QueueEntry {
  id: string
  number: number
  status: QueueStatus
  fio: string
  phone: string | null
  patientId: string | null
  doctorId: string | null
  doctorName: string
  /// Yozilgan lahza
  at: string
}
