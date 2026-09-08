import type { Permission } from '@e-dentist/shared'

export interface SessionUser {
  id: string
  email: string
  fullName: string | null
}

export interface SessionClinic {
  id: string
  name: string
  isTrial: boolean
  /// ISO sana: 2026-09-21T00:00:00.000Z
  expiresAt: string
  status: 'active' | 'blocked'
  /// Navbat sahifasining kodi: /n/<kod>
  queueCode: string
  queueEnabled: boolean
}

export interface SessionRole {
  name: string
  template: string
  isOwner: boolean
}

export interface Session {
  user: SessionUser
  clinic: SessionClinic | null
  role: SessionRole | null
  permissions: Permission[]
}
