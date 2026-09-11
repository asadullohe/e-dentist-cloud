import { apiRequest } from '@/shared/api'

export function uploadLogo(file: File) {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<{ hasLogo: true }>('/clinic/logo', { method: 'POST', body: form })
}

export const removeLogo = () => apiRequest<{ hasLogo: false }>('/clinic/logo', { method: 'DELETE' })
