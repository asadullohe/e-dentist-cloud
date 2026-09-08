import type { ToothChartData } from '@/entities/tooth'
import { apiRequest } from '@/shared/api'

export interface BridgePayload {
  from: number
  to: number
  material: string
  /// Tish raqami → rol. Berilmagan tishga server sukut rol qoʻyadi
  roles: Record<string, 'koronka' | 'koprik'>
}

export const createBridge = (patientId: string, payload: BridgePayload) =>
  apiRequest<ToothChartData>(`/patients/${patientId}/bridges`, { method: 'POST', body: payload })

export const deleteBridge = (id: string) =>
  apiRequest<ToothChartData>(`/bridges/${id}`, { method: 'DELETE' })
