import { apiRequest } from '@/shared/api'
import type { DebtorSort, DebtorsPage } from './model'

export interface DebtorsQuery {
  page: number
  pageSize: number
  sort: DebtorSort
  dir: 'asc' | 'desc'
}

export const fetchDebtors = (query: DebtorsQuery) =>
  apiRequest<DebtorsPage>(
    `/debtors?page=${query.page}&pageSize=${query.pageSize}&sort=${query.sort}&dir=${query.dir}`,
  )
