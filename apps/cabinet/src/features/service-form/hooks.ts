import { TOAST_TEXT } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SERVICE_KEYS } from '@/entities/service'
import * as api from './api'

export function useSaveService(id: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.ServicePayload) =>
      id ? api.updateService(id, payload) : api.createService(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SERVICE_KEYS.all }),
    meta: { success: () => TOAST_TEXT.service_saved, inlineErrors: true },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SERVICE_KEYS.all }),
    meta: { success: () => TOAST_TEXT.service_deleted },
  })
}
