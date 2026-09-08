import { apiRequest } from '@/shared/api'

export interface LoginPayload {
  email: string
  password: string
}

export const login = (payload: LoginPayload) =>
  apiRequest<{ loggedIn: true }>('/auth/login', { method: 'POST', body: payload })

export const logout = () => apiRequest<{ loggedOut: true }>('/auth/logout', { method: 'POST' })
