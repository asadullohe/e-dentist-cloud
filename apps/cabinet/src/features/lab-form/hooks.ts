import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LAB_KEYS } from '@/entities/lab-order'
import * as api from './api'

/// Naryad oʻzgarsa tish xaritasi va xarajatlar ham yangilanishi mumkin
/// (topshirilganda) — shuning uchun ular ham qayta soʻraladi
function useLabMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LAB_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['teeth'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useSaveLabOrder(id: string | null) {
  return useLabMutation((payload: api.LabPayload) =>
    id ? api.updateLabOrder(id, payload) : api.createLabOrder(payload),
  )
}

export function useSetLabStatus() {
  return useLabMutation(
    ({ id, status }: { id: string; status: Parameters<typeof api.setLabStatus>[1] }) =>
      api.setLabStatus(id, status),
  )
}

export function useReturnLabOrder() {
  return useLabMutation(
    ({
      id,
      reason,
      note,
    }: {
      id: string
      reason: Parameters<typeof api.returnLabOrder>[1]
      note: string | null
    }) => api.returnLabOrder(id, reason, note),
  )
}

export function useDeleteLabOrder() {
  return useLabMutation(api.deleteLabOrder)
}
