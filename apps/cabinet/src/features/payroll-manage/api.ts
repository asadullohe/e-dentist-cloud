import { apiRequest } from '@/shared/api'

export const recalculate = (month: string, userId: string) =>
  apiRequest<{ count: number; percent: number }>('/payroll/recalculate', {
    method: 'POST',
    body: { month, userId },
  })
