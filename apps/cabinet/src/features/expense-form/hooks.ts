import { TOAST_TEXT } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EXPENSE_KEYS } from '@/entities/expense'
import * as api from './api'

export function useSaveExpense(id: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.ExpensePayload) =>
      id ? api.updateExpense(id, payload) : api.createExpense(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all }),
    meta: {
      success: () => (id ? TOAST_TEXT.expense_updated : TOAST_TEXT.expense_created),
      inlineErrors: true,
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all }),
    meta: { success: () => TOAST_TEXT.expense_deleted },
  })
}
