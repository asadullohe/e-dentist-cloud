import { useQuery } from '@tanstack/react-query'
import { fetchBalance, fetchPayments } from './api'

export const PAYMENT_KEYS = {
  all: ['payments'] as const,
  ofPatient: (patientId: string) => ['payments', patientId] as const,
  balance: (patientId: string) => ['balance', patientId] as const,
}

export function usePayments(patientId: string | undefined) {
  return useQuery({
    queryKey: PAYMENT_KEYS.ofPatient(patientId ?? ''),
    queryFn: () => fetchPayments(patientId as string),
    enabled: Boolean(patientId),
  })
}

export function useBalance(patientId: string | undefined) {
  return useQuery({
    queryKey: PAYMENT_KEYS.balance(patientId ?? ''),
    queryFn: () => fetchBalance(patientId as string),
    enabled: Boolean(patientId),
  })
}
