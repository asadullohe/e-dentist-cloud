import { apiRequest } from '@/shared/api'
import type { ExpenseMonth } from './model'

/// `month` — YYYY-MM. Sahifa doim bitta oyni koʻrsatadi
export const fetchExpenses = (month: string) => apiRequest<ExpenseMonth>(`/expenses?month=${month}`)
