import { apiRequest } from '@/shared/api'
import type { Appointment, TimeBlock } from './model'

export const fetchAppointments = (from: string, to: string, doctorId?: string) =>
  apiRequest<Appointment[]>(
    `/appointments?from=${from}&to=${to}${doctorId ? `&doctorId=${doctorId}` : ''}`,
  )

export const fetchTimeBlocks = (from: string, to: string, doctorId?: string) =>
  apiRequest<TimeBlock[]>(
    `/time-blocks?from=${from}&to=${to}${doctorId ? `&doctorId=${doctorId}` : ''}`,
  )
