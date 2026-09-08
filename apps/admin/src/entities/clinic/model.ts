export interface ClinicSummary {
  id: string
  name: string
  phone: string | null
  plan: string
  isTrial: boolean
  /// YYYY-MM-DD
  expiresAt: string
  status: 'active' | 'blocked'
  createdAt: string
  staffCount: number
  lastLoginAt: string | null
  expired: boolean
}

export interface ClinicStaff {
  id: string
  email: string
  fullName: string | null
  roleName: string | null
  status: 'active' | 'disabled'
  lastLoginAt: string | null
}

export interface ClinicCard extends ClinicSummary {
  queueEnabled: boolean
  patientCount: number
  visitCount: number
  staff: ClinicStaff[]
  /// Kim, qachon, qanday amal. Yozuv identifikatorlari bu yerga tushmaydi
  history: { at: string; action: string; actor: string | null }[]
}
