export type AppointmentStatus = 'scheduled' | 'arrived' | 'no_show' | 'done' | 'cancelled'

export interface Appointment {
  id: string
  patientId: string
  /// Qabul qiladigan shifokor. Sukut — bemorning biriktirilgan shifokori
  doctorId: string | null
  doctorName: string | null
  /// ISO lahza: 2026-09-15T14:30:00.000Z
  at: string
  /// Daqiqa — jadvalda blok uzunligi
  duration: number
  /// Navbatdan kelgan yozuv — vaqt toʻrida chiziqli hoshiya bilan
  fromQueue: boolean
  status: AppointmentStatus
  note: string | null
  fio: string
  phone: string | null
}
