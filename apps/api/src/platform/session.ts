// Sessiya — Redis da, identifikatori esa httpOnly cookie da.
//
// Nega JWT emas: brauzer ilovasi uchun cookie xavfsizroq (JavaScript oʻqiy
// olmaydi) va sessiyani bekor qilish oson — xodim ishdan boʻshaganda uning
// kirishi darhol toʻxtashi kerak, JWT esa muddati tugaguncha amal qilaveradi.

import { randomBytes } from 'node:crypto'
import { Redis } from 'ioredis'

export const SESSION_COOKIE = 'ed_sessiya'
const SESSION_TTL = 60 * 60 * 24 * 7 // 7 kun
const sessionKey = (id: string) => `sessiya:${id}`

export interface SessionData {
  userId: string
  /// Platforma admini uchun boʻsh
  clinicId: string | null
}

// Diqqat: roleId bu yerda saqlanmaydi. Egasi xodimning rolini almashtirsa,
// sessiyadagi nusxa eskirib qolardi va xodim qayta kirmaguncha eski
// huquqlari bilan ishlab turardi. Rol har tekshiruvda bazadan oʻqiladi

export interface SessionStore {
  create(data: SessionData): Promise<string>
  read(id: string): Promise<SessionData | null>
  destroy(id: string): Promise<void>
  close(): Promise<void>
}

export function createSessionStore(redisUrl: string): SessionStore {
  const redis = new Redis(redisUrl)

  return {
    async create(data) {
      const id = randomBytes(32).toString('base64url')
      await redis.set(sessionKey(id), JSON.stringify(data), 'EX', SESSION_TTL)
      return id
    },

    async read(id) {
      const raw = await redis.get(sessionKey(id))
      if (!raw) return null
      try {
        return JSON.parse(raw) as SessionData
      } catch {
        // Buzuq yozuv — sessiya yoʻq deb hisoblaymiz
        return null
      }
    },

    async destroy(id) {
      await redis.del(sessionKey(id))
    },

    async close() {
      await redis.quit()
    },
  }
}
