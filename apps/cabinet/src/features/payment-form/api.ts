import type { Payment } from '@/entities/payment'
import { apiRequest } from '@/shared/api'

export interface PaymentPayload {
  patientId: string
  date: string
  amount: number
  note: string | null
}

export const createPayment = (payload: PaymentPayload) =>
  apiRequest<Payment>('/payments', { method: 'POST', body: payload })

/// Summa va sana oʻzgarmas — faqat izoh tuzatiladi
export const updatePaymentNote = (id: string, note: string | null) =>
  apiRequest<Payment>(`/payments/${id}`, { method: 'PATCH', body: { note } })

/// Oʻchirish yoʻq — bekor qilish, sabab bilan
export const cancelPayment = (id: string, reason: string) =>
  apiRequest<Payment>(`/payments/${id}/cancel`, { method: 'POST', body: { reason } })
