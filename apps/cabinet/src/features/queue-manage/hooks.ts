import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUEUE_KEYS } from '@/entities/queue'
import { SESSION_QUERY_KEY } from '@/entities/session'
import { actOnQueue, fetchQueue, type QueueAction, setQueueEnabled } from './api'

export function useQueue() {
  return useQuery({
    queryKey: QUEUE_KEYS.cabinet,
    queryFn: fetchQueue,
    // SSE oqimi kelmay qolsa ham roʻyxat eskirmasin
    refetchInterval: 60_000,
  })
}

export function useQueueAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: QueueAction }) => actOnQueue(id, action),
    onSuccess: (entries) => {
      // Javobda yangi roʻyxat keladi — qayta soʻramaymiz
      queryClient.setQueryData(QUEUE_KEYS.cabinet, entries)
      // Tasdiqlashda kartotekada yangi bemor paydo boʻlishi mumkin
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

export function useSetQueueEnabled() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setQueueEnabled,
    // Holat sessiya javobida keladi — menyu va sahifa shundan oʻqiydi
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}
