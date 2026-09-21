import { apiRequest } from '@/shared/api'

export interface PublicProfile {
  publicPhone: string | null
  address: string | null
  reviewUrl: string | null
}

export const savePublicProfile = (payload: PublicProfile) =>
  apiRequest<PublicProfile>('/clinic/public', { method: 'PATCH', body: payload })
