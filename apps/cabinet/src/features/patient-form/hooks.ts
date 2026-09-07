import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PATIENT_KEYS } from '@/entities/patient'
import * as api from './api'

export function useSavePatient(id: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.PatientPayload) =>
      id ? api.updatePatient(id, payload) : api.createPatient(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.all }),
  })
}

export function useDeletePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deletePatient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.all }),
  })
}
