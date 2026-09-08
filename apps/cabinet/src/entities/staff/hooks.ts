import { useQuery } from '@tanstack/react-query'
import { fetchRoles, fetchStaff, fetchStaffNames } from './api'

export const STAFF_KEYS = {
  all: ['staff'] as const,
  names: ['staff', 'names'] as const,
  roles: ['roles'] as const,
}

export function useStaff() {
  return useQuery({ queryKey: STAFF_KEYS.all, queryFn: fetchStaff })
}

/// Naryad formasi va filtri uchun. `staff.manage` talab qilmaydi
export function useStaffNames() {
  return useQuery({
    queryKey: STAFF_KEYS.names,
    queryFn: fetchStaffNames,
    staleTime: 5 * 60_000,
  })
}

export function useRoles() {
  return useQuery({
    queryKey: STAFF_KEYS.roles,
    queryFn: fetchRoles,
    // Rollar kam oʻzgaradi
    staleTime: 5 * 60_000,
  })
}
