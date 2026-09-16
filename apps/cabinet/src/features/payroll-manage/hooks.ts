import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EXPENSE_KEYS } from '@/entities/expense'
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

/// Toʻlov xarajatga tushadi — Xarajatlar va Hisobotlar keshi ham eskiradi
function usePayoutMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.all })
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useCreatePayout() {
  return usePayoutMutation(api.createPayout)
}

export function useDeletePayout() {
  return usePayoutMutation(api.deletePayout)
}
