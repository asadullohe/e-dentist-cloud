import { apiRequest } from '@/shared/api'
import type { Plan } from './model'

export function fetchPlans(patientId: string) {
  return apiRequest<Plan[]>(`/plans?patientId=${patientId}`)
}

export function fetchPlan(id: string) {
  return apiRequest<Plan>(`/plans/${id}`)
}
