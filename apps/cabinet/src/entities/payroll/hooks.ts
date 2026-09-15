import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchPayroll, fetchPayrollVisits } from './api'

export const PAYROLL_KEYS = {
  all: ['payroll'] as const,
  month: (month: string) => ['payroll', month] as const,
  visits: (month: string, userId: string | null) => ['payroll', month, 'visits', userId] as const,
}

export function usePayroll(month: string) {
  return useQuery({
    queryKey: PAYROLL_KEYS.month(month),
    queryFn: () => fetchPayroll(month),
    // Oy almashganda jadval boʻshab-toʻlib turmasin
    placeholderData: keepPreviousData,
  })
}

/// Xodimning oydagi ishlari. Qator ochilgandagina soʻraladi
export function usePayrollVisits(month: string, userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: PAYROLL_KEYS.visits(month, userId),
    queryFn: () => fetchPayrollVisits(month, userId),
    enabled,
  })
}
