export type AppointmentStatus = 'scheduled' | 'arrived' | 'no_show' | 'done' | 'cancelled'

export interface Appointment {
  id: string
  patientId: string
  /// ISO lahza: 2026-09-15T14:30:00.000Z
  at: string
  status: AppointmentStatus
  note: string | null
  fio: string
  phone: string | null
}
