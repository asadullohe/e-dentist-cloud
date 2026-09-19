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
    // Tahrirda faqat izoh ketadi — summa va sana serverda ham oʻzgarmas
    mutationFn: (payload: api.PaymentPayload) =>
      id ? api.updatePaymentNote(id, payload.note) : api.createPayment(payload),
    onSuccess: () => invalidate(queryClient),
    meta: {
      success: () => (id ? TOAST_TEXT.payment_updated : TOAST_TEXT.payment_created),
      inlineErrors: true,
    },
  })
}

/// Bekor qilish — sabab bilan. Xato forma ostida (sabab boʻsh boʻlsa)
export function useCancelPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.cancelPayment(id, reason),
    onSuccess: () => invalidate(queryClient),
    meta: { success: () => TOAST_TEXT.payment_cancelled, inlineErrors: true },
  })
}
