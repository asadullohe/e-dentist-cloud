import { ApiError, apiRequest } from '../../shared/api'
import type { Session } from './model'

/// Kirmagan foydalanuvchi uchun xato emas, `null`. 401 — oddiy holat,
/// TanStack Query uni «xato» deb koʻrsatmasligi kerak
export async function fetchSession(): Promise<Session | null> {
  try {
    return await apiRequest<Session>('/me')
  } catch (error) {
    if (error instanceof ApiError && error.code === 'unauthorized') return null
    throw error
  }
}
