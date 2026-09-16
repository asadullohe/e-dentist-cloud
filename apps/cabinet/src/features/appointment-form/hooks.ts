import { TOAST_TEXT } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { APPOINTMENT_KEYS, type AppointmentStatus } from '@/entities/appointment'
import * as api from './api'

export function useSaveAppointment(id: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.AppointmentPayload) =>
      id ? api.updateAppointment(id, payload) : api.createAppointment(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all }),
    meta: {
      success: () => (id ? TOAST_TEXT.appointment_updated : TOAST_TEXT.appointment_created),
      inlineErrors: true,
    },
  })
}

/// Roʻyxatdan turib holatni almashtirish: keldi, yakunlandi, kelmadi…
export function useSetAppointmentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.updateAppointment(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all }),
    meta: {
      success: (_data, { status }: { status: AppointmentStatus }) =>
        TOAST_TEXT[`appointment_${status}`],
    },
  })
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all }),
    meta: { success: () => TOAST_TEXT.appointment_deleted },
  })
}
