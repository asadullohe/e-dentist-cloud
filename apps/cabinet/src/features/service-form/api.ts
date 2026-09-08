import type { Service } from '@/entities/service'
import { apiRequest } from '@/shared/api'

export interface ServicePayload {
  name: string
  price: number
}

export const createService = (payload: ServicePayload) =>
  apiRequest<Service>('/services', { method: 'POST', body: payload })

export const updateService = (id: string, payload: ServicePayload) =>
  apiRequest<Service>(`/services/${id}`, { method: 'PATCH', body: payload })

export const deleteService = (id: string) =>
  apiRequest<{ deleted: true }>(`/services/${id}`, { method: 'DELETE' })
