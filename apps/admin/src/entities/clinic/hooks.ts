import { useQuery } from '@tanstack/react-query'
import { fetchClinic, fetchClinics } from './api'

export const CLINIC_KEYS = {
  all: ['clinics'] as const,
  list: (search: string) => ['clinics', 'list', search] as const,
  card: (id: string) => ['clinics', id] as const,
}

export function useClinics(search: string) {
  return useQuery({ queryKey: CLINIC_KEYS.list(search), queryFn: () => fetchClinics(search) })
}

export function useClinic(id: string) {
  return useQuery({ queryKey: CLINIC_KEYS.card(id), queryFn: () => fetchClinic(id) })
}
