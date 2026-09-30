import type { Permission } from '@e-dentist/shared'
import { useQuery } from '@tanstack/react-query'
import { isTransientError } from '@/shared/api'
import { readLastDoctor } from '@/shared/lib'
import { fetchSession } from './api'

export const SESSION_QUERY_KEY = ['session'] as const

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    // 401 — javob (null), xato emas. Server javob bermasa (qayta ishga
    // tushyapti, tarmoq) ikki marta kutib qayta soʻraymiz, aks holda kirgan
    // foydalanuvchi bir lahzalik uzilishda login sahifasiga tushardi.
    // Aniq rad javobi (403) qayta soʻralganda ham oʻzgarmaydi
    retry: (count, error) => count < 2 && isTransientError(error),
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

export interface DoctorScope {
  /// `*.all` ruxsati — hamma shifokor
  all: boolean
  /// Cheklangan koʻruvchi doirasi: shifokorda — oʻzi, assistentda — shifokorlari
  doctorIds: string[]
  /// Oʻzi shifokor emas, boshqalar nomidan ishlaydi (assistent)
  proxy: boolean
  /// Shu shifokorni tanlash mumkinmi
  allows(doctorId: string): boolean
  /// Yangi yozuv uchun sukut: berilgani doirada boʻlsa — u, keyin
  /// oxirgi tanlangan, keyin yagona shifokor. Shifokorning oʻzida — yoʻq
  /// (server oʻzini qoʻyadi)
  fallback(preferred?: string | null): string
}

/// Kimning bemorlari va qabullari bilan ishlaydi (tz.md 20-boʻlim).
/// Haqiqiy chegara serverda — bu yerda tanlovni toraytirish uchun
export function useDoctorScope(wide: Permission): DoctorScope {
  const { data } = useSession()
  const all = data?.permissions.includes(wide) ?? false
  const doctorIds = data?.scopeDoctorIds ?? []
  const proxy = !all && !!data && !doctorIds.includes(data.user.id)
  const allows = (doctorId: string) => all || doctorIds.includes(doctorId)
  return {
    all,
    doctorIds,
    proxy,
    allows,
    fallback(preferred) {
      if (preferred && allows(preferred)) return preferred
      if (!proxy) return ''
      const last = readLastDoctor()
      if (last && allows(last)) return last
      return doctorIds.length === 1 ? (doctorIds[0] ?? '') : ''
    },
  }
}
