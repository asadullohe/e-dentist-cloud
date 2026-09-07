// API javob shakli. Hamma joyda bir xil:
//   {ok: true,  data: …}
//   {ok: false, error: {code, message, fields?}}

import type { ApiOk, ApiXato } from '@e-dentist/shared'
import type { AppXato } from './errors.js'

export function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data }
}

export function xatoJavobi(e: AppXato): ApiXato {
  return {
    ok: false,
    error: {
      code: e.code,
      message: e.message,
      ...(e.fields ? { fields: e.fields } : {}),
    },
  }
}
