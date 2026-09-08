import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EXPENSE_KEYS } from '@/entities/expense'
import * as api from './api'

export function useSaveExpense(id: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.ExpensePayload) =>
      id ? api.updateExpense(id, payload) : api.createExpense(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all }),
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all }),
  })
}
