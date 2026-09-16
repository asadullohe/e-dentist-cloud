import { TOAST_TEXT } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SESSION_QUERY_KEY } from '@/entities/session'
import * as api from './api'

/// Logotip sessiya javobida keladi (klinika maʼlumoti bilan birga),
/// shuning uchun oʻzgargach sessiya qayta oʻqiladi — yon menyu ham
/// darrov yangilanadi
function useLogoMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>, success: () => string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
    // Karta xatoni oʻzi koʻrsatadi (fayl hajmi, turi)
    meta: { success, inlineErrors: true },
  })
}

export function useUploadLogo() {
  return useLogoMutation(
    (file: File) => api.uploadLogo(file),
    () => TOAST_TEXT.logo_saved,
  )
}

export function useRemoveLogo() {
  return useLogoMutation(
    () => api.removeLogo(),
    () => TOAST_TEXT.logo_removed,
  )
}
