import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TOOTH_KEYS } from '@/entities/tooth'
import * as api from './api'

/// Server tayyor xaritani qaytaradi — qayta soʻrash shart emas
export function useCreateBridge(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: api.BridgePayload) => api.createBridge(patientId, payload),
    onSuccess: (chart) => queryClient.setQueryData(TOOTH_KEYS.chart(patientId), chart),
  })
}

export function useDeleteBridge(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteBridge,
    onSuccess: (chart) => queryClient.setQueryData(TOOTH_KEYS.chart(patientId), chart),
  })
}
