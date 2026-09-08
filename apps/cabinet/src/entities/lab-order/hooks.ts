import { useQuery } from '@tanstack/react-query'
import { fetchLabOrders } from './api'
import type { LabFilter } from './model'

export const LAB_KEYS = {
  all: ['lab-orders'] as const,
  list: (filter: LabFilter) => ['lab-orders', filter] as const,
}

export function useLabOrders(filter: LabFilter) {
  return useQuery({ queryKey: LAB_KEYS.list(filter), queryFn: () => fetchLabOrders(filter) })
}
