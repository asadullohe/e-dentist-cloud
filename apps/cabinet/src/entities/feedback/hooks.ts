import type { FeedbackStatus } from '@e-dentist/shared'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchFeedback,
  fetchFeedbackPage,
  fetchFeedbackSummary,
  setFeedbackStatus,
  submitFeedback,
} from './api'
import type { FeedbackFilter, FeedbackSubmit } from './model'

export const FEEDBACK_KEYS = {
  all: ['feedback'] as const,
  page: (code: string) => ['feedback', 'page', code] as const,
  list: (filter: FeedbackFilter) => ['feedback', 'list', filter] as const,
  summary: (month?: string) => ['feedback', 'summary', month ?? 'all'] as const,
}

// ─────────────  Ochiq sahifa  ─────────────

export function useFeedbackPage(code: string) {
  return useQuery({
    queryKey: FEEDBACK_KEYS.page(code),
    queryFn: () => fetchFeedbackPage(code),
    retry: false,
  })
}

export function useSubmitFeedback(code: string) {
  return useMutation({
    mutationFn: (payload: FeedbackSubmit) => submitFeedback(code, payload),
    // Xato sahifaning oʻzida koʻrsatiladi — bemor toast bilmaydi
    meta: { inlineErrors: true },
  })
}

// ─────────────  Kabinet  ─────────────

export function useFeedbackList(filter: FeedbackFilter) {
  return useQuery({
    queryKey: FEEDBACK_KEYS.list(filter),
    queryFn: () => fetchFeedback(filter),
    placeholderData: keepPreviousData,
  })
}

export function useFeedbackSummary(month?: string) {
  return useQuery({
    queryKey: FEEDBACK_KEYS.summary(month),
    queryFn: () => fetchFeedbackSummary(month),
  })
}

export function useSetFeedbackStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
      setFeedbackStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FEEDBACK_KEYS.all }),
  })
}
