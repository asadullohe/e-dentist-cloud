import { TOAST_TEXT } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { VISIT_KEYS } from '@/entities/visit'
import * as api from './api'

export function useSaveVisit(id: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.VisitPayload) =>
      id ? api.updateVisit(id, payload) : api.createVisit(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VISIT_KEYS.all }),
    meta: {
      success: () => (id ? TOAST_TEXT.visit_updated : TOAST_TEXT.visit_created),
      inlineErrors: true,
    },
  })
}

/// Qabulni yakunlash — tashrif yoziladi, qabul va navbat roʻyxatlari eskiradi
export function useCompleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, ...payload }: { appointmentId: string } & api.CompletePayload) =>
      api.completeAppointment(appointmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISIT_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    },
    meta: { success: () => TOAST_TEXT.appointment_done, inlineErrors: true },
  })
}

/// Naryadni topshirish — tashrif yoziladi, naryad, tish xaritasi, xarajat,
/// ish haqi roʻyxatlari eskiradi
export function useDeliverLabOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ labOrderId, ...payload }: { labOrderId: string } & api.CompletePayload) =>
      api.deliverLabOrder(labOrderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISIT_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      queryClient.invalidateQueries({ queryKey: ['teeth'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
    meta: { success: () => TOAST_TEXT.lab_delivered, inlineErrors: true },
  })
}

export function useDeleteVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteVisit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VISIT_KEYS.all }),
    meta: { success: () => TOAST_TEXT.visit_deleted },
  })
}
