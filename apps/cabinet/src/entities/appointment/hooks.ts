import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchAppointments, fetchTimeBlocks } from './api'

export const APPOINTMENT_KEYS = {
  all: ['appointments'] as const,
  range: (from: string, to: string, doctorId?: string) =>
    ['appointments', from, to, doctorId ?? ''] as const,
  blocks: (from: string, to: string, doctorId?: string) =>
    ['appointments', 'blocks', from, to, doctorId ?? ''] as const,
}

export function useAppointments(from: string, to: string, doctorId?: string) {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.range(from, to, doctorId),
    queryFn: () => fetchAppointments(from, to, doctorId),
    // Oydan oyga oʻtganda kalendar boʻshab-toʻlib turmasin
    placeholderData: keepPreviousData,
  })
}

/// Shifokorning band vaqtlari — jadval bilan bir xil oraliqda
export function useTimeBlocks(from: string, to: string, doctorId?: string) {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.blocks(from, to, doctorId),
    queryFn: () => fetchTimeBlocks(from, to, doctorId),
    placeholderData: keepPreviousData,
  })
}
