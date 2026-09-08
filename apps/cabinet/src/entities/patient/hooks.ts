import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchPatient, fetchPatients } from './api'
import type { PatientQuery } from './model'

export const PATIENT_KEYS = {
  all: ['patients'] as const,
  list: (query: PatientQuery) => ['patients', 'list', query] as const,
  one: (id: string) => ['patients', 'one', id] as const,
}

export function usePatients(query: PatientQuery) {
  return useQuery({
    queryKey: PATIENT_KEYS.list(query),
    queryFn: () => fetchPatients(query),
    // Qidirayotganda jadval boʻshab-toʻlib turmasin — eski natija
    // yangisi kelguncha ekranda qoladi
    placeholderData: keepPreviousData,
  })
}

export function usePatient(id: string | null) {
  return useQuery({
    queryKey: PATIENT_KEYS.one(id ?? ''),
    queryFn: () => fetchPatient(id as string),
    enabled: Boolean(id),
  })
}
