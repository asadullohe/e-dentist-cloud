import { apiRequest } from '@/shared/api'
import type { PatientImage } from './model'

export const fetchImages = (patientId: string) =>
  apiRequest<PatientImage[]>(`/patients/${patientId}/images`)
