// Ish mantigʻidagi xatolar. Kod → HTTP holati moslashuvi shu yerda,
// route'larda emas: xato kodi bir joyda belgilanadi.

import type { ErrorCode } from '@e-dentist/shared'
import { ERROR_TEXT } from '@e-dentist/shared'

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  bad_request: 400,
  validation: 400,
  unauthorized: 401,
  subscription_expired: 402,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
}

interface ErrorOptions {
  // Foydalanuvchiga koʻrsatiladigan matn. Berilmasa strings.ts dagi umumiy matn
  message?: string
  // Forma tekshiruvida: maydon nomi → oʻzbekcha xato
  fields?: Record<string, string>
  // Asl xato — faqat logga tushadi, javobga hech qachon chiqmaydi
  cause?: unknown
}

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly fields: Record<string, string> | undefined

  constructor(code: ErrorCode, qoshimcha: ErrorOptions = {}) {
    super(qoshimcha.message ?? ERROR_TEXT[code], { cause: qoshimcha.cause })
    this.name = 'AppXato'
    this.code = code
    this.status = STATUS_BY_CODE[code]
    this.fields = qoshimcha.fields
  }
}

// Qisqa yozuv uchun. `throw xato.notFound('Bemor topilmadi')`
export const errors = {
  badRequest: (message?: string) => new AppError('bad_request', { message }),
  validation: (fields: Record<string, string>, message?: string) =>
    new AppError('validation', { fields, message }),
  unauthorized: (message?: string) => new AppError('unauthorized', { message }),
  forbidden: (message?: string) => new AppError('forbidden', { message }),
  notFound: (message?: string) => new AppError('not_found', { message }),
  conflict: (message?: string) => new AppError('conflict', { message }),
  rateLimited: (message?: string) => new AppError('rate_limited', { message }),
  subscriptionExpired: (message?: string) => new AppError('subscription_expired', { message }),
  internal: (cause?: unknown) => new AppError('internal', { cause }),
}
