import type { Permission } from '@e-dentist/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { STAFF_KEYS } from '@/entities/staff'
import * as api from './api'

function useStaffMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STAFF_KEYS.all }),
  })
}

export function useInviteStaff() {
  return useStaffMutation(api.inviteStaff)
}

export function useRevokeInvite() {
  return useStaffMutation(api.revokeInvite)
}

export function useUpdateStaff() {
  return useStaffMutation(
    ({ id, ...rest }: { id: string } & Parameters<typeof api.updateStaff>[1]) =>
      api.updateStaff(id, rest),
  )
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: Permission[] }) =>
      api.updateRolePermissions(id, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.roles })
      // Oʻz ruxsatlari oʻzgargan boʻlishi mumkin — menyu qayta chizilsin
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })
}

export function useInvite(token: string) {
  return useQuery({
    queryKey: ['invite', token],
    queryFn: () => api.fetchInvite(token),
    retry: false,
  })
}

export function useAcceptInvite() {
  return useMutation({ mutationFn: api.acceptInvite })
}
