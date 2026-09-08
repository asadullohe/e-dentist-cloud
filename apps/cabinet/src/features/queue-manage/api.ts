import type { QueueEntry } from '@/entities/queue'
import { apiRequest } from '@/shared/api'

export type QueueAction = 'confirm' | 'call' | 'arrived' | 'no_show' | 'done'

export const fetchQueue = () => apiRequest<QueueEntry[]>('/queue')

export const actOnQueue = (id: string, action: QueueAction) =>
  apiRequest<QueueEntry[]>(`/queue/${id}`, { method: 'PATCH', body: { action } })
