import type { DateRange } from '@e-dentist/shared'
import { apiRequest } from '@/shared/api'
import type { ExpenseMonth } from './model'

/// Davr — kun, hafta, oy yoki yil (`periodRange`)
export const fetchExpenses = ({ from, to }: DateRange) =>
  apiRequest<ExpenseMonth>(`/expenses?from=${from}&to=${to}`)
