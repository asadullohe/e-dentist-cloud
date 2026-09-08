import { useQuery } from '@tanstack/react-query'
import { fetchToothChart } from './api'

export const TOOTH_KEYS = {
  chart: (patientId: string) => ['teeth', patientId] as const,
}

export function useToothChart(patientId: string | undefined) {
  return useQuery({
    queryKey: TOOTH_KEYS.chart(patientId ?? ''),
    queryFn: () => fetchToothChart(patientId as string),
    enabled: Boolean(patientId),
  })
}
