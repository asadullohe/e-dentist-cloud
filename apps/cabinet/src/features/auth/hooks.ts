import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SESSION_QUERY_KEY } from '@/entities/session'
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

/// Havolani tekshirish. Xato boʻlsa qayta urinishning maʼnosi yoʻq —
/// muddati oʻtgan havola qayta soʻralganda ham amal qilmaydi
export function useInviteInfo(token: string) {
  return useQuery({
    queryKey: ['invite', token],
    queryFn: () => api.inviteInfo(token),
    enabled: token.length > 0,
    retry: false,
  })
}

/// Qabul qilingach odam darhol kabinetda boʻladi: server sessiya ochadi,
/// shuning uchun sessiya soʻrovi qaytadan oʻqiladi
export function useAcceptInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.acceptInvite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}
