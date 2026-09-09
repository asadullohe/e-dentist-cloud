import type { Permission } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { STAFF_KEYS } from '@/entities/staff'
import * as api from './api'

function useStaffMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STAFF_KEYS.all }),
  })
}

export function useCreateStaff() {
  return useStaffMutation(api.createStaff)
}

export function useChangePassword() {
  return useMutation({ mutationFn: api.changePassword })
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
