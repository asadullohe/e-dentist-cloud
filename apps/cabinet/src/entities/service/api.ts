import { apiRequest } from '@/shared/api'
import type { Service } from './model'

export const fetchServices = () => apiRequest<Service[]>('/services')
