import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PAYROLL_KEYS } from '@/entities/payroll'
import * as api from './api'

export function useRecalculate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ month, userId }: { month: string; userId: string }) =>
      api.recalculate(month, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.all }),
  })
}
