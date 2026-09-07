// Zod sxemasi orqali kirish maʼlumotini tekshiradi va xatolarni loyihaning
// javob shakliga keltiradi: maydon nomi → oʻzbekcha xato matni.

import type { ZodType } from 'zod'
import { errors } from './errors.js'

export function validateInput<T>(sxema: ZodType<T>, raw: unknown): T {
  const result = sxema.safeParse(raw)
  if (result.success) return result.data

  const fields: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'umumiy'
    // Bir maydonda bir nechta xato boʻlsa — birinchisi yetadi
    fields[key] ??= issue.message
  }
  throw errors.validation(fields)
}
