import { apiRequest } from '@/shared/api'
import type { Visit } from './model'

export const fetchVisits = (patientId: string) =>
  apiRequest<Visit[]>(`/patients/${patientId}/visits`)
