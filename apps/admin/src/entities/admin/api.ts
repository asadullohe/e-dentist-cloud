import { apiRequest } from '@/shared/api'

export interface Admin {
  id: string
  email: string
  fullName: string | null
}

export const fetchAdmin = () => apiRequest<Admin>('/admin/me')
