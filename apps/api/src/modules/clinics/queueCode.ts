// Navbat sahifasining kodi: /n/<kod>.
//
// Kod taxmin qilib boʻlmaydigan boʻlishi kerak — u ochiq sahifaning yagona
// himoyasi (tz.md 14-boʻlim). Shuning uchun tasodifiy sonlar
// `crypto` dan olinadi, `Math.random` dan emas.

import { randomInt } from 'node:crypto'

/// Chalkashadigan belgilar yoʻq: 0/O, 1/l/I. Kodni ovoz chiqarib aytish
/// yoki qoʻlda kiritish ham kerak boʻlib qoladi
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
const LENGTH = 8

export function generateQueueCode(): string {
  let code = ''
  for (let i = 0; i < LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)]
  }
  return code
}
