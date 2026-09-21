import type { FeedbackStatus } from '@e-dentist/shared'
import { apiRequest } from '@/shared/api'
import type {
  Feedback,
  FeedbackFilter,
  FeedbackList,
  FeedbackPage,
  FeedbackSubmit,
  FeedbackSubmitted,
  FeedbackSummary,
} from './model'

export const fetchFeedbackPage = (code: string) => apiRequest<FeedbackPage>(`/f/${code}`)

export const submitFeedback = (code: string, payload: FeedbackSubmit) =>
  apiRequest<FeedbackSubmitted>(`/f/${code}`, { method: 'POST', body: payload })

export function fetchFeedback(filter: FeedbackFilter) {
  const params = new URLSearchParams({
    page: String(filter.page),
    pageSize: String(filter.pageSize),
  })
  if (filter.status) params.set('status', filter.status)
  if (filter.low) params.set('low', 'true')
  if (filter.doctorId) params.set('doctorId', filter.doctorId)
  return apiRequest<FeedbackList>(`/feedback?${params}`)
}

export const fetchFeedbackSummary = (month?: string) =>
  apiRequest<FeedbackSummary>(month ? `/feedback/summary?month=${month}` : '/feedback/summary')

export const setFeedbackStatus = (id: string, status: FeedbackStatus) =>
  apiRequest<Feedback>(`/feedback/${id}`, { method: 'PATCH', body: { status } })
