import { apiRequest } from '@/shared/api'
import type { Role, StaffMember, StaffName } from './model'

export const fetchStaff = () => apiRequest<StaffMember[]>('/staff')

export const fetchRoles = () => apiRequest<Role[]>('/roles')

/// Faqat ism va id — naryadga texnik tanlash uchun
export const fetchStaffNames = () => apiRequest<StaffName[]>('/staff/names')
