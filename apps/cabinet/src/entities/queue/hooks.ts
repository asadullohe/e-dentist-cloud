import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchBoard, fetchTicket, type JoinPayload, joinQueue } from './api'

export const QUEUE_KEYS = {
  board: (code: string) => ['queue', code] as const,
  ticket: (code: string, id: string) => ['queue', code, 'ticket', id] as const,
}

/// Jonli yangilanish 4.3 da SSE ga oʻtadi. Hozircha oddiy takroriy soʻrov
const REFRESH_MS = 15_000

export function useQueueBoard(code: string) {
  return useQuery({
    queryKey: QUEUE_KEYS.board(code),
    queryFn: () => fetchBoard(code),
    refetchInterval: REFRESH_MS,
    retry: false,
  })
}

export function useQueueTicket(code: string, id: string | null) {
  return useQuery({
    queryKey: QUEUE_KEYS.ticket(code, id ?? ''),
    queryFn: () => fetchTicket(code, id as string),
    enabled: id !== null,
    refetchInterval: REFRESH_MS,
    retry: false,
  })
}

export function useJoinQueue(code: string) {
  return useMutation({ mutationFn: (payload: JoinPayload) => joinQueue(code, payload) })
}
