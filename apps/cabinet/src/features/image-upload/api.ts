import type { PatientImage } from '@/entities/patient-image'
import { apiRequest } from '@/shared/api'

export function uploadImage(patientId: string, file: File, caption: string) {
  const form = new FormData()
  // Izoh fayldan oldin yuboriladi: server uni fayl bilan bir formada oʻqiydi
  if (caption) form.append('caption', caption)
  form.append('file', file)
  return apiRequest<PatientImage>(`/patients/${patientId}/images`, { method: 'POST', body: form })
}

export const deleteImage = (id: string) =>
  apiRequest<{ deleted: true }>(`/images/${id}`, { method: 'DELETE' })
