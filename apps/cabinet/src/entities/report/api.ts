import { apiRequest } from '@/shared/api'
import type { Report } from './model'

export const fetchReport = (month: string) => apiRequest<Report>(`/reports?month=${month}`)
