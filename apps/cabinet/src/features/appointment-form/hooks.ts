import { useMutation, useQueryClient } from '@tanstack/react-query'
import { APPOINTMENT_KEYS } from '@/entities/appointment'
import * as api from './api'

export function useSaveAppointment(id: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.AppointmentPayload) =>
      id ? api.updateAppointment(id, payload) : api.createAppointment(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all }),
  })
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all }),
  })
}
