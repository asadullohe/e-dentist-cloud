// Parol xeshlash — argon2id.
//
// Oflayn ilovada scrypt ishlatilgan, bu yerda argon2id: u xotiraga ochkoʻz,
// shuning uchun videokartada parallel tanlashga qarshi kuchliroq.
// Parametrlar OWASP tavsiyasidan: 19 MiB xotira, 2 oʻtish.

import { hash, verify } from '@node-rs/argon2'

// @node-rs/argon2 dagi Algorithm — ambient const enum, uni verbatimModuleSyntax
// bilan import qilib boʻlmaydi. Argon2id = 2 (Argon2d=0, Argon2i=1)
const ARGON2ID = 2

const SOZLAMA = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
}

export function xeshlaParol(parol: string): Promise<string> {
  return hash(parol, SOZLAMA)
}

/// Xesh buzuq boʻlsa ham false qaytaradi — bu yerda xato otish kirish
/// oqimini kutilmagan 500 ga aylantirardi
export async function tekshirParol(xesh: string, parol: string): Promise<boolean> {
  try {
    return await verify(xesh, parol, SOZLAMA)
  } catch {
    return false
  }
}
