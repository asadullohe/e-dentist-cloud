import type { Appointment, AppointmentStatus } from '@/entities/appointment'
import { apiRequest } from '@/shared/api'

export interface AppointmentPayload {
  patientId?: string
  /// `null` — shifokorsiz; berilmasa server bemorning shifokorini oladi
  doctorId?: string | null
  date?: string
  time?: string
  status?: AppointmentStatus
  note?: string | null
}

export const createAppointment = (payload: AppointmentPayload) =>
  apiRequest<Appointment>('/appointments', { method: 'POST', body: payload })

export const updateAppointment = (id: string, payload: AppointmentPayload) =>
  apiRequest<Appointment>(`/appointments/${id}`, { method: 'PATCH', body: payload })

export const deleteAppointment = (id: string) =>
  apiRequest<{ deleted: true }>(`/appointments/${id}`, { method: 'DELETE' })
