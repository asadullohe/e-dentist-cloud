import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchDebtors } from './api'

export const DEBTOR_KEYS = {
  list: (page: number) => ['debtors', page] as const,
}

export function useDebtors(page: number) {
  return useQuery({
    queryKey: DEBTOR_KEYS.list(page),
    queryFn: () => fetchDebtors(page),
    placeholderData: keepPreviousData,
  })
}
