import type { Visit } from '@/entities/visit'
import { apiRequest } from '@/shared/api'

export interface VisitPayload {
  patientId?: string
  date: string
  treatment: string
  tooth: number | null
  price: number
  note: string | null
}

export const createVisit = (payload: VisitPayload) =>
  apiRequest<Visit>('/visits', { method: 'POST', body: payload })

export const updateVisit = (id: string, payload: VisitPayload) =>
  apiRequest<Visit>(`/visits/${id}`, { method: 'PATCH', body: payload })

export const deleteVisit = (id: string) =>
  apiRequest<{ deleted: true }>(`/visits/${id}`, { method: 'DELETE' })
