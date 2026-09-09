import { useQuery } from '@tanstack/react-query'
import { fetchAdmin } from './api'

export const ADMIN_QUERY_KEY = ['admin'] as const

export function useAdmin() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: fetchAdmin,
    // Kirmagan boʻlsa 401 keladi — qayta urinishning maʼnosi yoʻq
    retry: false,
  })
}
