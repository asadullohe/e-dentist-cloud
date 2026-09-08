import { useQuery } from '@tanstack/react-query'
import { fetchVisits } from './api'

export const VISIT_KEYS = {
  all: ['visits'] as const,
  ofPatient: (patientId: string) => ['visits', patientId] as const,
}

export function useVisits(patientId: string | undefined) {
  return useQuery({
    queryKey: VISIT_KEYS.ofPatient(patientId ?? ''),
    queryFn: () => fetchVisits(patientId as string),
    enabled: Boolean(patientId),
  })
}
