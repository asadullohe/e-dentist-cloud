import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchExpenses } from './api'

export const EXPENSE_KEYS = {
  all: ['expenses'] as const,
  month: (month: string) => ['expenses', month] as const,
}

export function useExpenses(month: string) {
  return useQuery({
    queryKey: EXPENSE_KEYS.month(month),
    queryFn: () => fetchExpenses(month),
    // Oydan oyga oʻtganda roʻyxat boʻshab-toʻlib turmasin
    placeholderData: keepPreviousData,
  })
}
