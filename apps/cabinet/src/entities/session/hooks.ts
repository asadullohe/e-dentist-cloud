import type { Permission } from '@e-dentist/shared'
import { useQuery } from '@tanstack/react-query'
import { fetchSession } from './api'

export const SESSION_QUERY_KEY = ['session'] as const

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    // 401 — javob (null), xato emas. Xato — server javob bermadi (qayta
    // ishga tushyapti, tarmoq): ikki marta kutib qayta soʻraymiz, aks holda
    // kirgan foydalanuvchi bir lahzalik uzilishda login sahifasiga tushardi
    retry: 2,
    retryDelay: (attempt) => 1500 * (attempt + 1),
  })
}

/// Menyu va tugmalarni koʻrsatish uchun. Haqiqiy himoya serverda —
/// bu yerdagisi faqat koʻrinish
/// Roʻyxat berilsa — istalgan biri yetarli (masalan, «hammasi» yoki «oʻziniki»)
export function useHasPermission(): (permission: Permission | readonly Permission[]) => boolean {
  const { data } = useSession()
  return (permission) => {
    const granted = data?.permissions ?? []
    return Array.isArray(permission)
      ? permission.some((item) => granted.includes(item))
      : granted.includes(permission as Permission)
  }
}
