import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchBoard, fetchTicket, type JoinPayload, joinQueue } from './api'

export const QUEUE_KEYS = {
  board: (code: string) => ['queue', code] as const,
  ticket: (code: string, id: string) => ['queue', code, 'ticket', id] as const,
}

/// Jonli yangilanish SSE orqali keladi. Bu esa zaxira: oqim uzilib
/// qolsa ham sahifa bir daqiqada bir marta yangilanadi
const FALLBACK_MS = 60_000

export function useQueueBoard(code: string) {
  return useQuery({
    queryKey: QUEUE_KEYS.board(code),
    queryFn: () => fetchBoard(code),
    refetchInterval: FALLBACK_MS,
    retry: false,
  })
}

export function useQueueTicket(code: string, id: string | null) {
  return useQuery({
    queryKey: QUEUE_KEYS.ticket(code, id ?? ''),
    queryFn: () => fetchTicket(code, id as string),
    enabled: id !== null,
    refetchInterval: FALLBACK_MS,
    retry: false,
  })
}

/// Navbat oʻzgarganda server bitta boʻsh hodisa yuboradi, sahifa esa
/// kerakli soʻrovni oʻzi qaytadan yuboradi. Shu sababli oqimda hech qanday
/// bemor maʼlumoti yurmaydi
export function useQueueStream(code: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!code) return
    const source = new EventSource(`/api/n/${code}/stream`)

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['queue', code] })
    }
    source.addEventListener('update', refresh)

    return () => {
      source.removeEventListener('update', refresh)
      source.close()
    }
  }, [code, queryClient])
}

export function useJoinQueue(code: string) {
  return useMutation({ mutationFn: (payload: JoinPayload) => joinQueue(code, payload) })
}
