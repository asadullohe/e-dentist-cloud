import { apiRequest } from '@/shared/api'
import type { Service, ServiceType } from './model'

export const fetchServices = () => apiRequest<Service[]>('/services')
export const fetchServiceTypes = () => apiRequest<ServiceType[]>('/service-types')
