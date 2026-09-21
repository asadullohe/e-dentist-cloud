import { TOAST_TEXT } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SERVICE_KEYS } from '@/entities/service'
import * as api from './api'

/// Tur va xizmat roʻyxatlari bir-biriga bogʻliq (turda soni bor) — ikkalasi
/// ham yangilanadi; kaliti umumiy prefiks
function useInvalidate() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: SERVICE_KEYS.all })
}

export function useSaveService(id: string | null) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (payload: api.ServicePayload) =>
      id ? api.updateService(id, payload) : api.createService(payload),
    onSuccess: invalidate,
    meta: {
      success: () => (id ? TOAST_TEXT.service_updated : TOAST_TEXT.service_created),
      inlineErrors: true,
    },
  })
}

export function useDeleteService() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: api.deleteService,
    onSuccess: invalidate,
    meta: { success: () => TOAST_TEXT.service_deleted },
  })
}

export function useSaveServiceType(id: string | null) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (name: string) =>
      id ? api.updateServiceType(id, name) : api.createServiceType(name),
    onSuccess: invalidate,
    meta: {
      success: () => (id ? TOAST_TEXT.service_type_updated : TOAST_TEXT.service_type_created),
      inlineErrors: true,
    },
  })
}

export function useDeleteServiceType() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: api.deleteServiceType,
    onSuccess: invalidate,
    meta: { success: () => TOAST_TEXT.service_type_deleted },
  })
}

/// Tartib: sahifa avval oʻzida almashtirib koʻrsatadi (optimistik), server
/// rad etsa roʻyxat qayta soʻraladi. Muvaffaqiyat toasti yoʻq — har
/// tortishda xabar chiqishi bezovta qiladi, natija koʻrinib turibdi
export function useReorderServiceTypes() {
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: api.reorderServiceTypes, onSettled: invalidate })
}

export function useReorderServices(typeId: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (ids: string[]) => api.reorderServices(typeId, ids),
    onSettled: invalidate,
  })
}
