// Ish mantigʻidagi xatolar. Kod → HTTP holati moslashuvi shu yerda,
// route'larda emas: xato kodi bir joyda belgilanadi.

import type { XatoKodi } from '@e-dentist/shared'
import { XATO_MATNI } from '@e-dentist/shared'

const HOLAT: Record<XatoKodi, number> = {
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

interface Qoshimcha {
  // Foydalanuvchiga koʻrsatiladigan matn. Berilmasa strings.ts dagi umumiy matn
  message?: string
  // Forma tekshiruvida: maydon nomi → oʻzbekcha xato
  fields?: Record<string, string>
  // Asl xato — faqat logga tushadi, javobga hech qachon chiqmaydi
  cause?: unknown
}

export class AppXato extends Error {
  readonly code: XatoKodi
  readonly status: number
  readonly fields: Record<string, string> | undefined

  constructor(code: XatoKodi, qoshimcha: Qoshimcha = {}) {
    super(qoshimcha.message ?? XATO_MATNI[code], { cause: qoshimcha.cause })
    this.name = 'AppXato'
    this.code = code
    this.status = HOLAT[code]
    this.fields = qoshimcha.fields
  }
}

// Qisqa yozuv uchun. `throw xato.notFound('Bemor topilmadi')`
export const xato = {
  badRequest: (message?: string) => new AppXato('bad_request', { message }),
  validation: (fields: Record<string, string>, message?: string) =>
    new AppXato('validation', { fields, message }),
  unauthorized: (message?: string) => new AppXato('unauthorized', { message }),
  forbidden: (message?: string) => new AppXato('forbidden', { message }),
  notFound: (message?: string) => new AppXato('not_found', { message }),
  conflict: (message?: string) => new AppXato('conflict', { message }),
  rateLimited: (message?: string) => new AppXato('rate_limited', { message }),
  subscriptionExpired: (message?: string) => new AppXato('subscription_expired', { message }),
  internal: (cause?: unknown) => new AppXato('internal', { cause }),
}
