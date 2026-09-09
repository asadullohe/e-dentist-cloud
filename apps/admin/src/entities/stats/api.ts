import { apiRequest } from '@/shared/api'

export interface Stats {
  total: number
  active: number
  trial: number
  expired: number
  blocked: number
  staff: number
  months: { month: string; registered: number; extended: number }[]
}

export interface PlatformEvent {
  at: string
  action: string
  clinicName: string
  actor: string | null
}

export const fetchStats = () => apiRequest<Stats>('/admin/stats')

export const fetchEvents = (all: boolean) =>
  apiRequest<PlatformEvent[]>(`/admin/events?all=${all ? '1' : '0'}&limit=100`)
