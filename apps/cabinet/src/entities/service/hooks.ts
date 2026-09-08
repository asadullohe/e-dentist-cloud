import { useQuery } from '@tanstack/react-query'
import { fetchServices } from './api'

export const SERVICE_KEYS = { all: ['services'] as const }

export function useServices() {
  return useQuery({
    queryKey: SERVICE_KEYS.all,
    queryFn: fetchServices,
    // Narxnoma kam oʻzgaradi — har tashrif formasida qayta soʻralmasin
    staleTime: 5 * 60_000,
  })
}
