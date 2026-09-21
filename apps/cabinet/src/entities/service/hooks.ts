import { useQuery } from '@tanstack/react-query'
import { fetchServices, fetchServiceTypes } from './api'

export const SERVICE_KEYS = {
  all: ['services'] as const,
  types: ['services', 'types'] as const,
}

/// Katalog kam oʻzgaradi — har tashrif formasida qayta soʻralmasin
const STALE = 5 * 60_000

export function useServices() {
  return useQuery({ queryKey: SERVICE_KEYS.all, queryFn: fetchServices, staleTime: STALE })
}

export function useServiceTypes() {
  return useQuery({ queryKey: SERVICE_KEYS.types, queryFn: fetchServiceTypes, staleTime: STALE })
}
