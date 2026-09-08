import { apiRequest } from '@/shared/api'
import type { Appointment } from './model'

export const fetchAppointments = (from: string, to: string) =>
  apiRequest<Appointment[]>(`/appointments?from=${from}&to=${to}`)
