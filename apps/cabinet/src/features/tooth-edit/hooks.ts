import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TOOTH_KEYS } from '@/entities/tooth'
import * as api from './api'

export function useSetTooth(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tooth, payload }: { tooth: number; payload: api.ToothPayload }) =>
      api.setTooth(patientId, tooth, payload),
    // Server tayyor xaritani qaytaradi — qayta soʻrash shart emas
    onSuccess: (chart) => queryClient.setQueryData(TOOTH_KEYS.chart(patientId), chart),
  })
}
