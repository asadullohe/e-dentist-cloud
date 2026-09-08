import type { Permission } from '@e-dentist/shared'
import type { Role, StaffMember, StaffStatus } from '@/entities/staff'
import { apiRequest } from '@/shared/api'

export interface InvitePayload {
  email: string
  roleId: string
}

export const inviteStaff = (payload: InvitePayload) =>
  apiRequest<{ id: string }>('/staff/invite', { method: 'POST', body: payload })

export const revokeInvite = (id: string) =>
  apiRequest<{ deleted: true }>(`/staff/invites/${id}`, { method: 'DELETE' })

export const updateStaff = (id: string, payload: { roleId?: string; status?: StaffStatus }) =>
  apiRequest<StaffMember>(`/staff/${id}`, { method: 'PATCH', body: payload })

export const updateRolePermissions = (id: string, permissions: Permission[]) =>
  apiRequest<Role>(`/roles/${id}`, { method: 'PATCH', body: { permissions } })

export interface AcceptPayload {
  token: string
  fullName: string
  password: string
}

export const fetchInvite = (token: string) =>
  apiRequest<{ email: string; clinicName: string; roleName: string }>(`/invites/${token}`)

export const acceptInvite = (payload: AcceptPayload) =>
  apiRequest<{ loggedIn: true }>('/invites/accept', { method: 'POST', body: payload })
