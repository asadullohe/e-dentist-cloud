import { formatDate, TOAST_TEXT } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { APPOINTMENT_KEYS, type Appointment, type AppointmentStatus } from '@/entities/appointment'
import { PATIENT_KEYS } from '@/entities/patient'
import * as api from './api'

export function useSaveAppointment(id: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.AppointmentPayload) =>
      id ? api.updateAppointment(id, payload) : api.createAppointment(payload),
    // Kutilmaydi (void): kutilsa mutateAsync yangi maʼlumot kelgandan keyin
    // qaytadi — forma hali ochiq, endigina yozilgan qabul oʻz vaqti bilan
    // «kesishadi» deb bir lahza qizarib koʻrinadi. Avval oyna yopilsin
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all })
    },
    meta: {
      success: () => (id ? TOAST_TEXT.appointment_updated : TOAST_TEXT.appointment_created),
      inlineErrors: true,
    },
  })
}

/// Toʻrda sudrab koʻchirish: sana/vaqt. Optimistik — blok darhol yangi joyda,
/// server rad etsa (409 — shifokor band) eski joyiga qaytadi, xato toastda
export function useMoveAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, date, time }: { id: string; date: string; time: string }) =>
      api.updateAppointment(id, { date, time }),
    onMutate: async ({ id, date, time }) => {
      await queryClient.cancelQueries({ queryKey: APPOINTMENT_KEYS.all })
      const snapshots = queryClient.getQueriesData<Appointment[]>({
        queryKey: APPOINTMENT_KEYS.all,
      })
      const at = new Date(`${date}T${time}:00`).toISOString()
      queryClient.setQueriesData<Appointment[]>({ queryKey: APPOINTMENT_KEYS.all }, (old) =>
        Array.isArray(old) ? old.map((item) => (item.id === id ? { ...item, at } : item)) : old,
      )
      return { snapshots }
    },
    onError: (_error, _vars, context) => {
      for (const [key, data] of context?.snapshots ?? []) queryClient.setQueryData(key, data)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all }),
    meta: {
      success: (_data, { date, time }: { date: string; time: string }) =>
        TOAST_TEXT.appointment_moved(`${formatDate(date)}, ${time}`),
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

/// Qabul formasidan yangi bemor: kartoteka roʻyxati yangilansin
export function useCreatePatientInline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createPatientInline,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.all }),
    meta: { inlineErrors: true },
  })
}

/// Band vaqt: saqlangach jadval (qabullar va bloklar) qayta oʻqiladi
export function useSaveTimeBlock(id: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.TimeBlockPayload) =>
      id ? api.updateTimeBlock(id, payload) : api.createTimeBlock(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all }),
    meta: { success: () => TOAST_TEXT.block_saved, inlineErrors: true },
  })
}

export function useDeleteTimeBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteTimeBlock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all }),
    meta: { success: () => TOAST_TEXT.block_deleted },
  })
}
