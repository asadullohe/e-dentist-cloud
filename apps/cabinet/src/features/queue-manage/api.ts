import type { QueueEntry } from '@/entities/queue'
import { apiRequest } from '@/shared/api'

export type QueueAction = 'confirm' | 'call' | 'arrived' | 'no_show' | 'done'

export const fetchQueue = () => apiRequest<QueueEntry[]>('/queue')

/// Kabinetdan navbatga qoʻshish: kartotekadagi bemor + shifokor
export const enqueue = (patientId: string, doctorId: string) =>
  apiRequest<QueueEntry[]>('/queue', { method: 'POST', body: { patientId, doctorId } })

export const actOnQueue = (id: string, action: QueueAction) =>
  apiRequest<QueueEntry[]>(`/queue/${id}`, { method: 'PATCH', body: { action } })

export const setQueueEnabled = (enabled: boolean) =>
  apiRequest<{ queueEnabled: boolean; queueCode: string }>('/clinic/queue', {
    method: 'PATCH',
    body: { enabled },
  })
