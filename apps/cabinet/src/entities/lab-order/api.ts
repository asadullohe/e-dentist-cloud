import { apiRequest } from '@/shared/api'
import type { LabFilter, LabOrder } from './model'

export function fetchLabOrders(filter: LabFilter) {
  const query = new URLSearchParams()
  if (filter.status) query.set('status', filter.status)
  if (filter.techId) query.set('techId', filter.techId)
  if (filter.patientId) query.set('patientId', filter.patientId)
  const suffix = query.size > 0 ? `?${query}` : ''
  return apiRequest<LabOrder[]>(`/lab-orders${suffix}`)
}
