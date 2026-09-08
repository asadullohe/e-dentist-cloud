import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchAppointments } from './api'

export const APPOINTMENT_KEYS = {
  all: ['appointments'] as const,
  range: (from: string, to: string) => ['appointments', from, to] as const,
}

export function useAppointments(from: string, to: string) {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.range(from, to),
    queryFn: () => fetchAppointments(from, to),
    // Oydan oyga oʻtganda kalendar boʻshab-toʻlib turmasin
    placeholderData: keepPreviousData,
  })
}
