// Zod sxemasi orqali kirish maʼlumotini tekshiradi va xatolarni loyihaning
// javob shakliga keltiradi: maydon nomi → oʻzbekcha xato matni.

import type { ZodType } from 'zod'
import { xato } from './errors.js'

export function tekshir<T>(sxema: ZodType<T>, xom: unknown): T {
  const natija = sxema.safeParse(xom)
  if (natija.success) return natija.data

  const maydonlar: Record<string, string> = {}
  for (const muammo of natija.error.issues) {
    const kalit = muammo.path.join('.') || 'umumiy'
    // Bir maydonda bir nechta xato boʻlsa — birinchisi yetadi
    maydonlar[kalit] ??= muammo.message
  }
  throw xato.validation(maydonlar)
}
