import type { ClinicKind } from '@e-dentist/shared'
import { apiRequest } from '@/shared/api'

/// Individual → klinika (tz.md 20-boʻlim). Takror chaqirilsa hech narsa oʻzgarmaydi
export const upgradeClinic = () =>
  apiRequest<{ kind: ClinicKind }>('/clinic/upgrade', { method: 'POST' })
