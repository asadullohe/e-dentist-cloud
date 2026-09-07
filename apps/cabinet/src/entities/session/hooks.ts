import type { Permission } from '@e-dentist/shared'
import { useQuery } from '@tanstack/react-query'
import { fetchSession } from './api'

export const SESSION_QUERY_KEY = ['session'] as const

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    // 401 — javob, xato emas. Qayta urinishning maʼnosi yoʻq
    retry: false,
  })
}

/// Menyu va tugmalarni koʻrsatish uchun. Haqiqiy himoya serverda —
/// bu yerdagisi faqat koʻrinish
export function useHasPermission(): (permission: Permission) => boolean {
  const { data } = useSession()
  return (permission) => data?.permissions.includes(permission) ?? false
}
