import type { DateRange } from '@e-dentist/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchReport } from './api'

export const REPORT_KEYS = {
  all: ['reports'] as const,
  range: (range: DateRange) => ['reports', range.from, range.to] as const,
}

export function useReport(range: DateRange) {
  return useQuery({
    queryKey: REPORT_KEYS.range(range),
    queryFn: () => fetchReport(range),
    // Davr almashganda grafik boʻshab-toʻlib turmasin
    placeholderData: keepPreviousData,
  })
}
