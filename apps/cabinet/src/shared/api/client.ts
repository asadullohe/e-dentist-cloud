// Serverga murojaat qatlami.
//
// Oflayn ilovada bu `window.api.*` edi. Almashtiriladigan yagona qatlam shu.
// Javob shakli serverdagi bilan bir xil: {ok, data} yoki {ok, error}.

import { ERROR_TEXT, UI_TEXT } from '@e-dentist/shared'

export class ApiError extends Error {
  readonly code: string
  readonly fields: Record<string, string> | undefined

  constructor(code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.fields = fields
  }
}

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } }

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options

  // FormData oʻz chegarasini oʻzi qoʻyadi — content-type ni qoʻlda
  // belgilash uni buzadi
  const isForm = body instanceof FormData

  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body && !isForm ? { 'content-type': 'application/json' } : undefined,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('network', UI_TEXT.offline)
  }

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!envelope || typeof envelope.ok !== 'boolean') {
    throw new ApiError('internal', ERROR_TEXT.internal)
  }
  if (!envelope.ok) {
    throw new ApiError(envelope.error.code, envelope.error.message, envelope.error.fields)
  }
  return envelope.data
}

/// Formadagi maydon xatolari. Boshqa xatolarda boʻsh obyekt
export function fieldErrors(error: unknown): Record<string, string> {
  return error instanceof ApiError ? (error.fields ?? {}) : {}
}

/// Formaning umumiy xatosi. Maydon xatolari boʻlsa — boʻsh satr,
/// chunki ular maydon ostida koʻrsatiladi
export function formError(error: unknown): string {
  if (!(error instanceof ApiError)) return ''
  return error.fields ? '' : error.message
}

/// Fayl yuklab olish. apiRequest JSON kutadi, bu esa ikkilik fayl bilan
/// ishlaydi va brauzerga saqlashni topshiradi
export async function downloadFile(path: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, { credentials: 'same-origin' })
  } catch {
    throw new ApiError('network', UI_TEXT.offline)
  }

  if (!response.ok) {
    const envelope = (await response.json().catch(() => null)) as ApiEnvelope<unknown> | null
    if (envelope && !envelope.ok) {
      throw new ApiError(envelope.error.code, envelope.error.message)
    }
    throw new ApiError('internal', ERROR_TEXT.internal)
  }

  // Fayl nomi serverdan keladi — u oʻzbekcha va sanali
  const disposition = response.headers.get('content-disposition') ?? ''
  const encoded = /filename\*=UTF-8''([^;]+)/.exec(disposition)?.[1]
  const filename = encoded ? decodeURIComponent(encoded) : 'export.xlsx'

  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
