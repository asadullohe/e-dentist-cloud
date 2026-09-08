import { apiRequest } from '@/shared/api'
import type { BridgeInfo, ToothInfo } from './model'

export interface ToothChartData {
  teeth: ToothInfo[]
  bridges: BridgeInfo[]
}

export const fetchToothChart = (patientId: string) =>
  apiRequest<ToothChartData>(`/patients/${patientId}/teeth`)
