import { useQuery } from '@tanstack/react-query'
import { fetchLabOrders, fetchLabs } from './api'
import type { LabFilter } from './model'

export const LAB_KEYS = {
  all: ['lab-orders'] as const,
  list: (filter: LabFilter) => ['lab-orders', filter] as const,
  places: ['labs'] as const,
}

export function useLabOrders(filter: LabFilter) {
  return useQuery({ queryKey: LAB_KEYS.list(filter), queryFn: () => fetchLabOrders(filter) })
}

/// Tashqi laboratoriyalar — naryad formasi va Sozlamalar. `lab.write` talab qiladi
export function useLabs(enabled = true) {
  return useQuery({ queryKey: LAB_KEYS.places, queryFn: fetchLabs, enabled, staleTime: 5 * 60_000 })
}
