import { apiRequest } from '@/shared/api'

export interface LoginPayload {
  email: string
  password: string
}

// `app` — klinika xodimi hisobi bilan panelga sessiya ochilmaydi
export const login = (payload: LoginPayload) =>
  apiRequest<{ loggedIn: true }>('/auth/login', {
    method: 'POST',
    body: { ...payload, app: 'admin' },
  })

export const logout = () => apiRequest<{ loggedOut: true }>('/auth/logout', { method: 'POST' })
