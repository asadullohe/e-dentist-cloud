import type { Payment } from '@/entities/payment'
import { apiRequest } from '@/shared/api'

export interface PaymentPayload {
  patientId?: string
  date: string
  amount: number
  note: string | null
}

export const createPayment = (payload: PaymentPayload) =>
  apiRequest<Payment>('/payments', { method: 'POST', body: payload })

export const updatePayment = (id: string, payload: PaymentPayload) =>
  apiRequest<Payment>(`/payments/${id}`, { method: 'PATCH', body: payload })

export const deletePayment = (id: string) =>
  apiRequest<{ deleted: true }>(`/payments/${id}`, { method: 'DELETE' })
