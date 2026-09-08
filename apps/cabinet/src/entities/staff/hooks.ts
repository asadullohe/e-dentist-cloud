import { useQuery } from '@tanstack/react-query'
import { fetchRoles, fetchStaff } from './api'

export const STAFF_KEYS = {
  all: ['staff'] as const,
  roles: ['roles'] as const,
}

export function useStaff() {
  return useQuery({ queryKey: STAFF_KEYS.all, queryFn: fetchStaff })
}

export function useRoles() {
  return useQuery({
    queryKey: STAFF_KEYS.roles,
    queryFn: fetchRoles,
    // Rollar kam oʻzgaradi
    staleTime: 5 * 60_000,
  })
}
