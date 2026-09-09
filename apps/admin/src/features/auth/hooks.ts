import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ADMIN_QUERY_KEY } from '@/entities/admin'
import * as api from './api'

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.login,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY }),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => queryClient.clear(),
  })
}
