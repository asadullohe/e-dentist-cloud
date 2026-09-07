import { apiRequest } from '../../shared/api'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  clinicName: string
  phone?: string | undefined
  fullName: string
  email: string
  password: string
}

export const login = (input: LoginInput) =>
  apiRequest<{ kirildi: true }>('/auth/login', { method: 'POST', body: input })

export const logout = () => apiRequest<{ chiqildi: true }>('/auth/logout', { method: 'POST' })

export const register = (input: RegisterInput) =>
  apiRequest<{ clinicId: string }>('/auth/register', { method: 'POST', body: input })

export const verifyEmail = (token: string) =>
  apiRequest<{ tasdiqlandi: true }>('/auth/verify', { method: 'POST', body: { token } })
