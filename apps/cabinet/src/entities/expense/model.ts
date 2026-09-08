import type { EXPENSE_CATEGORY_LABELS } from '@e-dentist/shared'

export type ExpenseCategory = keyof typeof EXPENSE_CATEGORY_LABELS

export interface Expense {
  id: string
  /// YYYY-MM-DD
  date: string
  category: ExpenseCategory
  description: string
  /// Soʻm, butun son
  amount: number
}

export interface ExpenseMonth {
  items: Expense[]
  total: number
  byCategory: { category: ExpenseCategory; total: number }[]
}
