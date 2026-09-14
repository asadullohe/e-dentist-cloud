import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { type DebtorsQuery, fetchDebtors } from './api'

export const DEBTOR_KEYS = {
  list: (query: DebtorsQuery) => ['debtors', query] as const,
}

export function useDebtors(query: DebtorsQuery) {
  return useQuery({
    queryKey: DEBTOR_KEYS.list(query),
    queryFn: () => fetchDebtors(query),
    placeholderData: keepPreviousData,
  })
}
