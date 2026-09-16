import { TOAST_TEXT } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PATIENT_KEYS } from '@/entities/patient'
import * as api from './api'

export function usePreviewImport() {
  return useMutation({
    mutationFn: ({ file, hasHeader }: { file: File; hasHeader: boolean }) =>
      api.previewImport(file, hasHeader),
    meta: { inlineErrors: true },
  })
}

export function useCommitImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ token, mode }: { token: string; mode: api.DuplicateMode }) =>
      api.commitImport(token, mode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.all }),
    meta: {
      success: (result: { added: number; updated: number }) =>
        TOAST_TEXT.import_done(result.added, result.updated),
      inlineErrors: true,
    },
  })
}
