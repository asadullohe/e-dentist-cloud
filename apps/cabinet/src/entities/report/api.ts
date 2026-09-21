import type { DateRange } from '@e-dentist/shared'
import { apiRequest } from '@/shared/api'
import type { Report } from './model'

/// Davr — kun, hafta, oy yoki yil (`periodRange`)
export const fetchReport = ({ from, to }: DateRange) =>
  apiRequest<Report>(`/reports?from=${from}&to=${to}`)
