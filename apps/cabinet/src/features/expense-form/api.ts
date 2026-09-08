import type { Expense, ExpenseCategory } from '@/entities/expense'
import { apiRequest } from '@/shared/api'

export interface ExpensePayload {
  date: string
  category: ExpenseCategory
  description: string
  amount: number
}

export const createExpense = (payload: ExpensePayload) =>
  apiRequest<Expense>('/expenses', { method: 'POST', body: payload })

export const updateExpense = (id: string, payload: ExpensePayload) =>
  apiRequest<Expense>(`/expenses/${id}`, { method: 'PATCH', body: payload })

export const deleteExpense = (id: string) =>
  apiRequest<{ deleted: true }>(`/expenses/${id}`, { method: 'DELETE' })
