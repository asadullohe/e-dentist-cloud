import type { FeedbackSource, FeedbackStatus, FeedbackTag } from '@e-dentist/shared'

/// Ochiq sahifa (/f/<kod>) koʻradigan narsa
export interface FeedbackPage {
  clinicName: string
  hasLogo: boolean
  reviewUrl: string | null
  doctors: { id: string; fullName: string }[]
}

export interface FeedbackSubmit {
  rating: number
  tags: FeedbackTag[]
  comment?: string
  phone?: string
  doctorId?: string | null
  ticketId?: string | null
  source: 'qr' | 'page'
}

export interface FeedbackSubmitted {
  id: string
  rating: number
  reviewUrl: string | null
}

/// Kabinetdagi fikr
export interface Feedback {
  id: string
  doctorId: string | null
  doctorName: string | null
  patientId: string | null
  rating: number
  tags: FeedbackTag[]
  comment: string | null
  phone: string | null
  source: FeedbackSource
  status: FeedbackStatus
  createdAt: string
}

export interface FeedbackList {
  items: Feedback[]
  total: number
}

export interface FeedbackSummary {
  count: number
  average: number | null
  newCount: number
  byDoctor: { doctorId: string | null; doctorName: string | null; count: number; average: number }[]
}

export interface FeedbackFilter {
  status?: FeedbackStatus
  low?: boolean
  doctorId?: string
  page: number
  pageSize: number
}
