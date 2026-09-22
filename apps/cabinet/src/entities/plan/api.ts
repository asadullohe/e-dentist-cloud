import { apiRequest } from '@/shared/api'
import type { Plan, PlanPublic, PlanStatus } from './model'

export function fetchPlans(patientId: string) {
  return apiRequest<Plan[]>(`/plans?patientId=${patientId}`)
}

export function fetchPlan(id: string) {
  return apiRequest<Plan>(`/plans/${id}`)
}

// ─────────────  Ochiq sahifa: /r/<kod>  ─────────────
// Sessiyasiz ochiladi — bemorning telefonidan

export function fetchPublicPlan(code: string) {
  return apiRequest<PlanPublic>(`/r/${encodeURIComponent(code)}`)
}

export function respondToPlan(
  code: string,
  body: { accept: boolean; phoneTail?: string; reason?: string | null },
) {
  return apiRequest<{ status: PlanStatus }>(`/r/${encodeURIComponent(code)}`, {
    method: 'POST',
    body,
  })
}
