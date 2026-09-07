import type { Patient } from '@/entities/patient'
import { apiRequest } from '@/shared/api'

export interface PatientPayload {
  fio: string
  phone?: string | undefined
  birthDate?: string | undefined
  address?: string | undefined
  note?: string | undefined
}

export const createPatient = (payload: PatientPayload) =>
  apiRequest<Patient>('/patients', { method: 'POST', body: payload })

export const updatePatient = (id: string, payload: PatientPayload) =>
  apiRequest<Patient>(`/patients/${id}`, { method: 'PATCH', body: payload })

export const deletePatient = (id: string) =>
  apiRequest<{ deleted: true }>(`/patients/${id}`, { method: 'DELETE' })
