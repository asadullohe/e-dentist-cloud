import type { Service, ServiceType } from '@/entities/service'
import { apiRequest } from '@/shared/api'

export interface ServicePayload {
  typeId: string
  name: string
  price: number
}

export const createService = (payload: ServicePayload) =>
  apiRequest<Service>('/services', { method: 'POST', body: payload })

export const updateService = (id: string, payload: ServicePayload) =>
  apiRequest<Service>(`/services/${id}`, { method: 'PATCH', body: payload })

export const deleteService = (id: string) =>
  apiRequest<{ deleted: true }>(`/services/${id}`, { method: 'DELETE' })

export const createServiceType = (name: string) =>
  apiRequest<ServiceType>('/service-types', { method: 'POST', body: { name } })

export const updateServiceType = (id: string, name: string) =>
  apiRequest<ServiceType>(`/service-types/${id}`, { method: 'PATCH', body: { name } })

export const deleteServiceType = (id: string) =>
  apiRequest<{ deleted: true }>(`/service-types/${id}`, { method: 'DELETE' })

export const reorderServiceTypes = (ids: string[]) =>
  apiRequest<{ reordered: true }>('/service-types/order', { method: 'PATCH', body: { ids } })

export const reorderServices = (typeId: string, ids: string[]) =>
  apiRequest<{ reordered: true }>(`/service-types/${typeId}/order`, {
    method: 'PATCH',
    body: { ids },
  })
