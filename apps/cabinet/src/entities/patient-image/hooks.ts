import { useQuery } from '@tanstack/react-query'
import { fetchImages } from './api'

export const IMAGE_KEYS = {
  ofPatient: (patientId: string) => ['images', patientId] as const,
}

export function useImages(patientId: string | undefined) {
  return useQuery({
    queryKey: IMAGE_KEYS.ofPatient(patientId ?? ''),
    queryFn: () => fetchImages(patientId as string),
    enabled: Boolean(patientId),
    // Havolalar besh daqiqada eskiradi — undan oldin yangilab turamiz
    staleTime: 4 * 60_000,
  })
}
