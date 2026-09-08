import type { ToothChartData } from '@/entities/tooth'
import { apiRequest } from '@/shared/api'

export interface ToothPayload {
  status: string
  material: string | null
  note: string | null
}

/// Butun xaritani qaytaradi — bitta tishni emas
export const setTooth = (patientId: string, tooth: number, payload: ToothPayload) =>
  apiRequest<ToothChartData>(`/patients/${patientId}/teeth/${tooth}`, {
    method: 'PUT',
    body: payload,
  })
