import { apiRequest } from '@/shared/api'
import type { Role, StaffList, StaffName } from './model'

export const fetchStaff = () => apiRequest<StaffList>('/staff')

export const fetchRoles = () => apiRequest<Role[]>('/roles')

/// Faqat ism va id — naryadga texnik tanlash uchun
export const fetchStaffNames = () => apiRequest<StaffName[]>('/staff/names')
