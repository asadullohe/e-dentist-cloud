import { apiRequest } from '@/shared/api'

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
  apiRequest<{ loggedIn: true }>('/auth/login', { method: 'POST', body: input })

export const logout = () => apiRequest<{ loggedOut: true }>('/auth/logout', { method: 'POST' })

export const register = (input: RegisterInput) =>
  apiRequest<{ clinicId: string }>('/auth/register', { method: 'POST', body: input })

export const verifyEmail = (token: string) =>
  apiRequest<{ verified: true }>('/auth/verify', { method: 'POST', body: { token } })

export interface InviteInfo {
  clinicName: string
  email: string
  roleName: string
}

export interface InviteAcceptInput {
  token: string
  fullName: string
  password: string
}

/// Havola amal qiladimi va kimga tegishli — sahifa ochilganda
export const inviteInfo = (token: string) =>
  apiRequest<InviteInfo>(`/auth/invite/${encodeURIComponent(token)}`)

export const acceptInvite = (input: InviteAcceptInput) =>
  apiRequest<{ loggedIn: true }>('/auth/invite', { method: 'POST', body: input })
