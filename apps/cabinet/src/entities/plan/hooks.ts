import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/shared/api'
import { fetchPlan, fetchPlans, fetchPublicPlan } from './api'

export const PLAN_KEYS = {
  all: ['plans'] as const,
  list: (patientId: string) => ['plans', 'list', patientId] as const,
  one: (id: string) => ['plans', 'one', id] as const,
  public: (code: string) => ['plans', 'public', code] as const,
}

export function usePlans(patientId: string) {
  return useQuery({ queryKey: PLAN_KEYS.list(patientId), queryFn: () => fetchPlans(patientId) })
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: PLAN_KEYS.one(id),
    queryFn: () => fetchPlan(id),
    enabled: !!id,
    // Reja topilmasa (oʻchirilgan, begona, shifokorga koʻrinmaydi) qayta
    // soʻrash foydasiz — sahifa darhol roʻyxatga qaytarsin
    retry: (count, error) =>
      count < 1 && !(error instanceof ApiError && error.code === 'not_found'),
  })
}

/// Ochiq sahifa. Bemor havolani ochadi — sessiya yoʻq
export function usePublicPlan(code: string) {
  return useQuery({
    queryKey: PLAN_KEYS.public(code),
    queryFn: () => fetchPublicPlan(code),
    enabled: !!code,
    retry: (count, error) =>
      count < 1 && !(error instanceof ApiError && error.code === 'not_found'),
  })
}
