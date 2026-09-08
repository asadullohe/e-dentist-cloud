import { apiRequest } from '@/shared/api'
import type { QueueBoard, QueueScreen, QueueTicket } from './model'

export const fetchBoard = (code: string) => apiRequest<QueueBoard>(`/n/${code}`)

export const fetchScreen = (code: string) => apiRequest<QueueScreen>(`/n/${code}/screen`)

export const fetchTicket = (code: string, id: string) =>
  apiRequest<QueueTicket>(`/n/${code}/ticket/${id}`)

export interface JoinPayload {
  doctorId: string
  fullName: string
  phone?: string
}

export const joinQueue = (code: string, payload: JoinPayload) =>
  apiRequest<QueueTicket>(`/n/${code}/join`, { method: 'POST', body: payload })
