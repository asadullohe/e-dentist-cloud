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
  /// Hozir chaqirilganlar. Ismlar yoʻq — faqat raqam va shifokor
  called: { number: number; doctorName: string }[]
  next: number[]
}
