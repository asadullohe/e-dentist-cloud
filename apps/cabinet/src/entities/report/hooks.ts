import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchReport } from './api'

export const REPORT_KEYS = {
  all: ['reports'] as const,
  month: (month: string) => ['reports', month] as const,
}

export function useReport(month: string) {
  return useQuery({
    queryKey: REPORT_KEYS.month(month),
    queryFn: () => fetchReport(month),
    // Oy almashganda grafik boʻshab-toʻlib turmasin
    placeholderData: keepPreviousData,
  })
}
