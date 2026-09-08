import { apiRequest } from '@/shared/api'
import type { Role, StaffList } from './model'

export const fetchStaff = () => apiRequest<StaffList>('/staff')

export const fetchRoles = () => apiRequest<Role[]>('/roles')
