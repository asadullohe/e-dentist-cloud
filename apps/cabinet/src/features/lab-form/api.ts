import type { LabOrder, LabReturnReason, LabStatus } from '@/entities/lab-order'
import { apiRequest } from '@/shared/api'

export interface LabPayload {
  patientId?: string
  techId?: string | null
  teeth: number[]
  workType: string
  material: string
  shade?: string | null
  dueDate: string
  techPrice?: number
  note?: string | null
}

export const createLabOrder = (payload: LabPayload) =>
  apiRequest<LabOrder>('/lab-orders', { method: 'POST', body: payload })

export const updateLabOrder = (id: string, payload: Omit<LabPayload, 'patientId'>) =>
  apiRequest<LabOrder>(`/lab-orders/${id}`, { method: 'PATCH', body: payload })

export const setLabStatus = (id: string, status: LabStatus) =>
  apiRequest<LabOrder>(`/lab-orders/${id}/status`, { method: 'PATCH', body: { status } })

export const returnLabOrder = (id: string, reason: LabReturnReason, note: string | null) =>
  apiRequest<LabOrder>(`/lab-orders/${id}/return`, { method: 'POST', body: { reason, note } })

export const deleteLabOrder = (id: string) =>
  apiRequest<{ deleted: true }>(`/lab-orders/${id}`, { method: 'DELETE' })
