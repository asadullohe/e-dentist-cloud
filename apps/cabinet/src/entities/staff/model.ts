import type { Permission } from '@e-dentist/shared'

export type StaffStatus = 'active' | 'disabled'

export interface StaffMember {
  id: string
  email: string
  fullName: string | null
  roleId: string | null
  roleName: string | null
  status: StaffStatus
  lastLoginAt: string | null
}

export interface StaffName {
  id: string
  fullName: string | null
}

export interface PendingInvite {
  id: string
  email: string
  roleId: string
  roleName: string | null
  expiresAt: string
}

export interface StaffList {
  staff: StaffMember[]
  invites: PendingInvite[]
}

export interface Role {
  id: string
  name: string
  template: string
  permissions: Permission[]
  isOwner: boolean
}
