import type { DateRange } from '@e-dentist/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchExpenses } from './api'

export const EXPENSE_KEYS = {
  all: ['expenses'] as const,
  range: (range: DateRange) => ['expenses', range.from, range.to] as const,
}

export function useExpenses(range: DateRange) {
  return useQuery({
    queryKey: EXPENSE_KEYS.range(range),
    queryFn: () => fetchExpenses(range),
    // Davrdan davrga oʻtganda roʻyxat boʻshab-toʻlib turmasin
    placeholderData: keepPreviousData,
  })
}
