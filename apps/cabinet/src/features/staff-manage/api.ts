import type { Permission } from '@e-dentist/shared'
import type { Role, StaffMember, StaffStatus } from '@/entities/staff'
import { apiRequest } from '@/shared/api'

export interface StaffPayload {
  email: string
  fullName: string
  roleId: string
  /// Parolni egasi belgilaydi va xodimga aytadi
  password: string
  salaryAmount: number
  payPercent: number
}

export interface StaffUpdatePayload {
  roleId?: string
  status?: StaffStatus
  salaryAmount?: number
  payPercent?: number
}

export const createStaff = (payload: StaffPayload) =>
  apiRequest<StaffMember>('/staff', { method: 'POST', body: payload })

export const updateStaff = (id: string, payload: StaffUpdatePayload) =>
  apiRequest<StaffMember>(`/staff/${id}`, { method: 'PATCH', body: payload })

export const updateRolePermissions = (id: string, permissions: Permission[]) =>
  apiRequest<Role>(`/roles/${id}`, { method: 'PATCH', body: { permissions } })

export interface PasswordPayload {
  currentPassword: string
  newPassword: string
}

export const changePassword = (payload: PasswordPayload) =>
  apiRequest<{ changed: true }>('/me/password', { method: 'POST', body: payload })
