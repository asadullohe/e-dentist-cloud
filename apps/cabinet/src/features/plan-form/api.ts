import type { Plan, PlanStageDraft, PlanStatus } from '@/entities/plan'
import { apiRequest } from '@/shared/api'

export interface PlanPayload {
  patientId?: string
  doctorId?: string
  title?: string
  discount?: number
  validUntil?: string | null
  note?: string | null
}

export const createPlan = (payload: PlanPayload) =>
  apiRequest<Plan>('/plans', { method: 'POST', body: payload })

export const updatePlan = (id: string, payload: Omit<PlanPayload, 'patientId'>) =>
  apiRequest<Plan>(`/plans/${id}`, { method: 'PATCH', body: payload })

/// Bosqichlar va bandlar birgalikda — kelmagan yozuv oʻchadi
export const savePlanContent = (id: string, stages: PlanStageDraft[]) =>
  apiRequest<Plan>(`/plans/${id}/content`, { method: 'PUT', body: { stages } })

export const setPlanStatus = (id: string, status: PlanStatus, reason?: string | null) =>
  apiRequest<Plan>(`/plans/${id}/status`, { method: 'POST', body: { status, reason } })

/// Bandni «oʻtkazib yuborildi» ga oʻtkazish yoki qaytarish (13.4).
/// Bajarish esa tashrif formasi orqali — `features/visit-form` da
export const skipPlanItem = (planId: string, itemId: string, skip: boolean) =>
  apiRequest<Plan>(`/plans/${planId}/items/${itemId}/skip`, { method: 'POST', body: { skip } })
