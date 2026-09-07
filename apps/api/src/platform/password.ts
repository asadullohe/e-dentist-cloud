// Parol xeshlash — argon2id.
//
// Oflayn ilovada scrypt ishlatilgan, bu yerda argon2id: u xotiraga ochkoʻz,
// shuning uchun videokartada parallel tanlashga qarshi kuchliroq.
// Parametrlar OWASP tavsiyasidan: 19 MiB xotira, 2 oʻtish.

import { hash, verify } from '@node-rs/argon2'

// @node-rs/argon2 dagi Algorithm — ambient const enum, uni verbatimModuleSyntax
// bilan import qilib boʻlmaydi. Argon2id = 2 (Argon2d=0, Argon2i=1)
const ARGON2ID = 2

const ARGON2_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
}

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS)
}

/// Xesh buzuq boʻlsa ham false qaytaradi — bu yerda xato otish kirish
/// oqimini kutilmagan 500 ga aylantirardi
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await verify(hash, password, ARGON2_OPTIONS)
  } catch {
    return false
  }
}
