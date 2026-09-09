import { useQuery } from '@tanstack/react-query'
import { fetchEvents, fetchStats } from './api'

export const STATS_KEYS = {
  stats: ['stats'] as const,
  events: (all: boolean) => ['events', all] as const,
}

export function useStats() {
  return useQuery({ queryKey: STATS_KEYS.stats, queryFn: fetchStats })
}

export function useEvents(all: boolean) {
  return useQuery({ queryKey: STATS_KEYS.events(all), queryFn: () => fetchEvents(all) })
}
