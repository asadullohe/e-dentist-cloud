import { apiRequest } from '@/shared/api'
import type { Payroll, PayrollVisit } from './model'

export const fetchPayroll = (month: string) => apiRequest<Payroll>(`/payroll?month=${month}`)

/// `userId` boʻsh — soʻrovchining oʻzi (payroll.own)
export const fetchPayrollVisits = (month: string, userId: string | null) =>
  apiRequest<PayrollVisit[]>(`/payroll/visits?month=${month}${userId ? `&userId=${userId}` : ''}`)
