import { TOAST_TEXT } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SESSION_QUERY_KEY } from '@/entities/session'
import { STAFF_KEYS } from '@/entities/staff'
import { upgradeClinic } from './api'

/// Oʻtgach butun interfeys klinika koʻrinishiga oʻtadi: sessiyadagi tur
/// (menyu, jadval, formalar) va rollar roʻyxati yangilanadi
export function useUpgradeClinic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: upgradeClinic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.all })
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.roles })
    },
    meta: { success: () => TOAST_TEXT.clinic_upgraded },
  })
}
