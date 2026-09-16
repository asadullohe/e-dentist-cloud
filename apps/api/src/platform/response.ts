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

/// Fayl yuklab berish sarlavhasi. Har doim `filename*=UTF-8''` shakli:
/// nomda oʻzbekcha harf va apostrof boʻlishi mumkin, oddiy `filename="…"`
/// ularni buzadi. Kabinet aynan shu shaklni oʻqiydi (shared/api/client.ts)
export function attachment(filename: string): string {
  return `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
}
