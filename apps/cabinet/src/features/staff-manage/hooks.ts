import type { Permission } from '@e-dentist/shared'
import { TOAST_TEXT } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { STAFF_KEYS } from '@/entities/staff'
import * as api from './api'

/// Xodim oynalari (yangi xodim, ish haqi sharti, jadvaldagi rol/holat)
/// xatoni oʻzi koʻrsatadi — toast faqat muvaffaqiyatda
function useStaffMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  success: (data: TResult, variables: TArgs) => string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STAFF_KEYS.all }),
    meta: { success, inlineErrors: true },
  })
}

export function useCreateStaff() {
  return useStaffMutation(api.createStaff, () => TOAST_TEXT.staff_created)
}

export function useChangePassword() {
  return useMutation({
    mutationFn: api.changePassword,
    meta: { success: () => TOAST_TEXT.password_changed, inlineErrors: true },
  })
}

/// Bitta soʻrov — uch xil amal: rol, holat, ish haqi sharti. Toast matni
/// nima yuborilganiga qarab tanlanadi
export function useUpdateStaff() {
  return useStaffMutation(
    ({ id, ...rest }: { id: string } & Parameters<typeof api.updateStaff>[1]) =>
      api.updateStaff(id, rest),
    (_data, { roleId, status }) => {
      if (status === 'disabled') return TOAST_TEXT.staff_disabled
      if (status === 'active') return TOAST_TEXT.staff_enabled
      if (roleId) return TOAST_TEXT.staff_role_changed
      return TOAST_TEXT.staff_pay_saved
    },
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
    meta: { success: () => TOAST_TEXT.role_saved, inlineErrors: true },
  })
}
