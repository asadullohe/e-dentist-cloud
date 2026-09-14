import { apiRequest } from '@/shared/api'
import type { DebtorSort, DebtorsPage } from './model'

export interface DebtorsQuery {
  /// Ism yoki telefon boʻyicha (thead filtri)
  q?: string
  page: number
  pageSize: number
  sort: DebtorSort
  dir: 'asc' | 'desc'
}

export const fetchDebtors = (query: DebtorsQuery) => {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sort: query.sort,
    dir: query.dir,
  })
  if (query.q) params.set('q', query.q)
  return apiRequest<DebtorsPage>(`/debtors?${params}`)
}
