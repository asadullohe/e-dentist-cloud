import { apiRequest } from '@/shared/api'
import type { DebtorsPage } from './model'

export const fetchDebtors = (page: number) =>
  apiRequest<DebtorsPage>(`/debtors?page=${page}&pageSize=50`)
