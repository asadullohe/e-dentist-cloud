// API javob shakli. Hamma joyda bir xil:
//   {ok: true,  data: …}
//   {ok: false, error: {code, message, fields?}}

import type { ApiErrorResponse, ApiOk } from '@e-dentist/shared'
import type { AppError } from './errors.js'

export function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data }
}

export function errorResponse(e: AppError): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code: e.code,
      message: e.message,
      ...(e.fields ? { fields: e.fields } : {}),
    },
  }
}
