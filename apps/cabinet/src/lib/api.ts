// Serverga murojaat qatlami.
//
// Oflayn ilovada bu `window.api.*` edi. Almashtiriladigan yagona qatlam shu —
// sahifalar deyarli oʻzgarmaydi.

import { KABINET, type Ruxsat, XATO_MATNI } from '@e-dentist/shared'

export interface Men {
  user: { id: string; email: string; fullName: string | null }
  clinic: {
    id: string
    name: string
    isTrial: boolean
    expiresAt: string
    status: 'active' | 'blocked'
  } | null
  role: { name: string; template: string; isOwner: boolean } | null
  permissions: Ruxsat[]
}

export class ApiXato extends Error {
  readonly code: string
  readonly fields: Record<string, string> | undefined

  constructor(code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiXato'
    this.code = code
    this.fields = fields
  }
}

async function sorov<T>(yol: string, usul = 'GET', tan?: unknown): Promise<T> {
  let javob: Response
  try {
    javob = await fetch(`/api${yol}`, {
      method: usul,
      credentials: 'same-origin',
      headers: tan ? { 'content-type': 'application/json' } : undefined,
      body: tan ? JSON.stringify(tan) : undefined,
    })
  } catch {
    throw new ApiXato('tarmoq', KABINET.aloqa_yoq)
  }

  const javobTani = (await javob.json().catch(() => null)) as
    | { ok: true; data: T }
    | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } }
    | null

  if (!javobTani || typeof javobTani.ok !== 'boolean') {
    throw new ApiXato('internal', XATO_MATNI.internal)
  }
  if (!javobTani.ok) {
    throw new ApiXato(javobTani.error.code, javobTani.error.message, javobTani.error.fields)
  }
  return javobTani.data
}

export interface RoyxatTani {
  clinicName: string
  phone?: string
  fullName: string
  email: string
  password: string
}

export const api = {
  men: () => sorov<Men>('/me'),
  kir: (email: string, password: string) =>
    sorov<{ kirildi: true }>('/auth/login', 'POST', { email, password }),
  chiq: () => sorov<{ chiqildi: true }>('/auth/logout', 'POST'),
  royxat: (tan: RoyxatTani) => sorov<{ clinicId: string }>('/auth/register', 'POST', tan),
  tasdiqla: (token: string) => sorov<{ tasdiqlandi: true }>('/auth/verify', 'POST', { token }),
}
