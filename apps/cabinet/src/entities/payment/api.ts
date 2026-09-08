import { apiRequest } from '@/shared/api'
import type { Balance, Payment } from './model'

export const fetchPayments = (patientId: string) =>
  apiRequest<Payment[]>(`/patients/${patientId}/payments`)

export const fetchBalance = (patientId: string) =>
  apiRequest<Balance>(`/patients/${patientId}/balance`)
