import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PAYMENT_KEYS } from '@/entities/payment'
import * as api from './api'

/// Toʻlov oʻzgarsa hisob ham, qarzdorlar roʻyxati ham eskiradi
function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all })
  queryClient.invalidateQueries({ queryKey: ['balance'] })
  queryClient.invalidateQueries({ queryKey: ['debtors'] })
}

export function useSavePayment(id: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.PaymentPayload) =>
      id ? api.updatePayment(id, payload) : api.createPayment(payload),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deletePayment,
    onSuccess: () => invalidate(queryClient),
  })
}
