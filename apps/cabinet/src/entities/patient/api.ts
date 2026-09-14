import { apiRequest } from '@/shared/api'
import type { Patient, PatientPage, PatientQuery } from './model'

export function fetchPatients(query: PatientQuery): Promise<PatientPage> {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.fio) params.set('fio', query.fio)
  if (query.phone) params.set('phone', query.phone)
  if (query.address) params.set('address', query.address)
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.sort) params.set('sort', query.sort)
  if (query.dir) params.set('dir', query.dir)
  const search = params.toString()
  return apiRequest<PatientPage>(`/patients${search ? `?${search}` : ''}`)
}

export function fetchPatient(id: string): Promise<Patient> {
  return apiRequest<Patient>(`/patients/${id}`)
}
