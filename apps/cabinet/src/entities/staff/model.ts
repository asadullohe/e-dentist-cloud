import type { Permission } from '@e-dentist/shared'

export type StaffStatus = 'active' | 'disabled'

export interface StaffMember {
  id: string
  email: string
  fullName: string | null
  roleId: string | null
  roleName: string | null
  status: StaffStatus
  /// Ish haqi sharti: oylik (soʻm) va ish narxidan foiz
  salaryAmount: number
  payPercent: number
  lastLoginAt: string | null
}

export interface StaffName {
  id: string
  fullName: string | null
}

/// Jadval ustuni va «Shifokor» tanlovi uchun: rol nomi bilan (14.6)
export interface DoctorName extends StaffName {
  roleName: string | null
}

export interface Role {
  id: string
  name: string
  template: string
  permissions: Permission[]
  isOwner: boolean
}
