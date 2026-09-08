import { apiRequest } from '@/shared/api'
import type { ClinicCard, ClinicSummary } from './model'

export const fetchClinics = (search: string) =>
  apiRequest<ClinicSummary[]>(`/admin/clinics?search=${encodeURIComponent(search)}`)

export const fetchClinic = (id: string) => apiRequest<ClinicCard>(`/admin/clinics/${id}`)

export const extendClinic = (id: string, days: number) =>
  apiRequest<ClinicCard>(`/admin/clinics/${id}/extend`, { method: 'POST', body: { days } })

export const setClinicStatus = (id: string, status: 'active' | 'blocked') =>
  apiRequest<ClinicCard>(`/admin/clinics/${id}/status`, { method: 'POST', body: { status } })
