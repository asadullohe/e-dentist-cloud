import { useMutation, useQueryClient } from '@tanstack/react-query'
import { VISIT_KEYS } from '@/entities/visit'
import * as api from './api'

export function useSaveVisit(id: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.VisitPayload) =>
      id ? api.updateVisit(id, payload) : api.createVisit(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VISIT_KEYS.all }),
  })
}

export function useDeleteVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteVisit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VISIT_KEYS.all }),
  })
}
