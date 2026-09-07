import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SESSION_QUERY_KEY } from '../../entities/session'
import * as api from './api'

/// Kirgandan keyin sessiya soʻrovi qaytadan oʻqiladi — kim kirgani,
/// qaysi klinika va qanday ruxsatlari borligi serverdan keladi
export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.login,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.logout,
    // Chiqqandan keyin keshda hech narsa qolmasin: keyingi foydalanuvchi
    // oldingisining maʼlumotini koʻrmasligi kerak
    onSuccess: () => queryClient.clear(),
  })
}

export function useRegister() {
  return useMutation({ mutationFn: api.register })
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: api.verifyEmail })
}
