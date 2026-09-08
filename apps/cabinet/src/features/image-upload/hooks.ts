import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IMAGE_KEYS } from '@/entities/patient-image'
import * as api from './api'

export function useUploadImage(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, caption }: { file: File; caption: string }) =>
      api.uploadImage(patientId, file, caption),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: IMAGE_KEYS.ofPatient(patientId) }),
  })
}

export function useDeleteImage(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteImage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: IMAGE_KEYS.ofPatient(patientId) }),
  })
}
