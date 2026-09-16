import { TOAST_TEXT } from '@e-dentist/shared'
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
    meta: {
      success: () => (id ? TOAST_TEXT.payment_updated : TOAST_TEXT.payment_created),
      inlineErrors: true,
    },
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deletePayment,
    onSuccess: () => invalidate(queryClient),
    meta: { success: () => TOAST_TEXT.payment_deleted },
  })
}
