import { apiRequest } from '@/shared/api'
import type { ClinicCard, ClinicSummary } from './model'

export const fetchClinics = (search: string) =>
  apiRequest<ClinicSummary[]>(`/admin/clinics?search=${encodeURIComponent(search)}`)

export const fetchClinic = (id: string) => apiRequest<ClinicCard>(`/admin/clinics/${id}`)

export interface ClinicCreatePayload {
  name: string
  phone?: string
  email: string
  trialDays: number
}

/// Parol yuborilmaydi — egasi uni taklifnoma havolasi orqali oʻzi qoʻyadi
export const createClinic = (payload: ClinicCreatePayload) =>
  apiRequest<ClinicCard>('/admin/clinics', { method: 'POST', body: payload })

export const resendInvite = (id: string) =>
  apiRequest<ClinicCard>(`/admin/clinics/${id}/invite`, { method: 'POST' })

export const extendClinic = (id: string, days: number) =>
  apiRequest<ClinicCard>(`/admin/clinics/${id}/extend`, { method: 'POST', body: { days } })

export const setClinicStatus = (id: string, status: 'active' | 'blocked') =>
  apiRequest<ClinicCard>(`/admin/clinics/${id}/status`, { method: 'POST', body: { status } })

/// Logotipni panel ham qoʻya oladi — klinika ochib berayotganda qulay
export function setClinicLogo(id: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<ClinicCard>(`/admin/clinics/${id}/logo`, { method: 'POST', body: form })
}

export const removeClinicLogo = (id: string) =>
  apiRequest<ClinicCard>(`/admin/clinics/${id}/logo`, { method: 'DELETE' })
