import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUEUE_KEYS } from '@/entities/queue'
import { actOnQueue, fetchQueue, type QueueAction } from './api'

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
