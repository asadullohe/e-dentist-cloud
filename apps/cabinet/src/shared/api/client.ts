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
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options

  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
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
