import type { Visit } from '@/entities/visit'
import { apiRequest } from '@/shared/api'

export interface VisitPayload {
  patientId?: string
  doctorId: string
  date: string
  /// «HH:MM»
  time: string
  treatment: string
  tooth: number | null
  serviceId?: string | null
  price: number
  /// Texnik narxi; naryad topshirishda server naryadnikini oladi
  labCost?: number
  note: string | null
}

/// Qabulni yakunlash: tashrif + qabul «Yakunlandi», bitta soʻrov.
/// Bemor va sana qabuldan — payload'da yuborilmaydi
export type CompletePayload = Omit<VisitPayload, 'patientId' | 'date'>

export const completeAppointment = (appointmentId: string, payload: CompletePayload) =>
  apiRequest<{ appointment: { id: string; at: string }; visit: Visit }>(
    `/appointments/${appointmentId}/complete`,
    { method: 'POST', body: payload },
  )

/// Naryadni topshirish: tashrif + naryad «topshirildi», bitta soʻrov.
/// Bemor va sana (bugun) naryaddan — payload'da yuborilmaydi
export const deliverLabOrder = (labOrderId: string, payload: CompletePayload) =>
  apiRequest<{ order: { id: string }; visit: Visit }>(`/lab-orders/${labOrderId}/deliver`, {
    method: 'POST',
    body: payload,
  })

export const createVisit = (payload: VisitPayload) =>
  apiRequest<Visit>('/visits', { method: 'POST', body: payload })

export const updateVisit = (id: string, payload: VisitPayload) =>
  apiRequest<Visit>(`/visits/${id}`, { method: 'PATCH', body: payload })

export const deleteVisit = (id: string) =>
  apiRequest<{ deleted: true }>(`/visits/${id}`, { method: 'DELETE' })
