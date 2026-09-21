import { FEEDBACK_CABINET_UI } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SESSION_QUERY_KEY } from '@/entities/session'
import { savePublicProfile } from './api'

/// Kontaktlar sessiya javobida (klinika bilan birga) keladi — saqlangach
/// sessiya qayta oʻqiladi, varaq va sahifalar yangisini koʻradi
export function useSavePublicProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: savePublicProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
    meta: { success: () => FEEDBACK_CABINET_UI.saved, inlineErrors: true },
  })
}
