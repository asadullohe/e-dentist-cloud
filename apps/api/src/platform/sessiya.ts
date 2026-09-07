// Sessiya — Redis da, identifikatori esa httpOnly cookie da.
//
// Nega JWT emas: brauzer ilovasi uchun cookie xavfsizroq (JavaScript oʻqiy
// olmaydi) va sessiyani bekor qilish oson — xodim ishdan boʻshaganda uning
// kirishi darhol toʻxtashi kerak, JWT esa muddati tugaguncha amal qilaveradi.

import { randomBytes } from 'node:crypto'
import { Redis } from 'ioredis'

export const COOKIE_NOMI = 'ed_sessiya'
const OMR_SONIYA = 60 * 60 * 24 * 7 // 7 kun
const KALIT = (id: string) => `sessiya:${id}`

export interface SessiyaMazmuni {
  userId: string
  /// Platforma admini uchun boʻsh
  clinicId: string | null
  roleId: string | null
}

export interface SessiyaSaqlagich {
  yarat(mazmun: SessiyaMazmuni): Promise<string>
  oqi(id: string): Promise<SessiyaMazmuni | null>
  ochir(id: string): Promise<void>
  yop(): Promise<void>
}

export function yaratSessiyaSaqlagich(redisUrl: string): SessiyaSaqlagich {
  const redis = new Redis(redisUrl)

  return {
    async yarat(mazmun) {
      const id = randomBytes(32).toString('base64url')
      await redis.set(KALIT(id), JSON.stringify(mazmun), 'EX', OMR_SONIYA)
      return id
    },

    async oqi(id) {
      const xom = await redis.get(KALIT(id))
      if (!xom) return null
      try {
        return JSON.parse(xom) as SessiyaMazmuni
      } catch {
        // Buzuq yozuv — sessiya yoʻq deb hisoblaymiz
        return null
      }
    },

    async ochir(id) {
      await redis.del(KALIT(id))
    },

    async yop() {
      await redis.quit()
    },
  }
}
