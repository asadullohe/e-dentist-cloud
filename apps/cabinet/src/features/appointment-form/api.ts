import type { Appointment, AppointmentStatus, TimeBlock } from '@/entities/appointment'
import type { Patient } from '@/entities/patient'
import { apiRequest } from '@/shared/api'

export interface AppointmentPayload {
  patientId?: string
  /// `null` — shifokorsiz; berilmasa server bemorning shifokorini oladi
  doctorId?: string | null
  date?: string
  time?: string
  /// Daqiqa
  duration?: number
  status?: AppointmentStatus
  note?: string | null
}

export const createAppointment = (payload: AppointmentPayload) =>
  apiRequest<Appointment>('/appointments', { method: 'POST', body: payload })

export const updateAppointment = (id: string, payload: AppointmentPayload) =>
  apiRequest<Appointment>(`/appointments/${id}`, { method: 'PATCH', body: payload })

/// Qabul formasidan yangi bemor: features/patient-form ga tegmasdan (qatlam
/// qoidasi — feature feature ni import qilmaydi) — faqat ism va telefon
export const createPatientInline = (payload: { fio: string; phone?: string; doctorId?: string }) =>
  apiRequest<Patient>('/patients', { method: 'POST', body: payload })

export interface TimeBlockPayload {
  doctorId?: string
  fromDate: string
  fromTime: string
  toDate: string
  toTime: string
  reason?: string | null
}

export const createTimeBlock = (payload: TimeBlockPayload) =>
  apiRequest<TimeBlock>('/time-blocks', { method: 'POST', body: payload })

export const updateTimeBlock = (id: string, payload: TimeBlockPayload) =>
  apiRequest<TimeBlock>(`/time-blocks/${id}`, { method: 'PATCH', body: payload })

export const deleteTimeBlock = (id: string) =>
  apiRequest<{ deleted: true }>(`/time-blocks/${id}`, { method: 'DELETE' })
