import type { Payout } from '@/entities/payroll'
import { apiRequest } from '@/shared/api'

export const recalculate = (month: string, userId: string) =>
  apiRequest<{ count: number; percent: number }>('/payroll/recalculate', {
    method: 'POST',
    body: { month, userId },
  })

export interface PayoutPayload {
  month: string
  userId: string
  amount: number
  /// YYYY-MM-DD
  date: string
  note: string | null
}

export const createPayout = (payload: PayoutPayload) =>
  apiRequest<Payout>('/payroll/payouts', { method: 'POST', body: payload })

export const deletePayout = (id: string) =>
  apiRequest<{ deleted: true }>(`/payroll/payouts/${id}`, { method: 'DELETE' })
