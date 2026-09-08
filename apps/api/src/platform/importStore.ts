// Excel yuklash seansi. Fayl bir marta yuklanadi va tahlil qilinadi, natija
// esa shu yerda saqlanadi — «Yuklash» bosilganda fayl qaytadan yuborilmaydi.
//
// Kalitga clinicId kiradi: boshqa klinikaning tokeni bilan hech narsa
// oʻqib boʻlmaydi.

import { randomBytes } from 'node:crypto'
import { Redis } from 'ioredis'

/// Yarim soat — mijoz oldindan koʻrishni oʻqib, qaror qabul qilishiga yetadi
const TTL_SECONDS = 30 * 60

export interface ImportStore {
  save(clinicId: string, data: unknown): Promise<string>
  read<T>(clinicId: string, token: string): Promise<T | null>
  close(): Promise<void>
}

export function createImportStore(redisUrl: string): ImportStore {
  const redis = new Redis(redisUrl)
  const key = (clinicId: string, token: string) => `import:${clinicId}:${token}`

  return {
    async save(clinicId, data) {
      const token = randomBytes(16).toString('base64url')
      await redis.set(key(clinicId, token), JSON.stringify(data), 'EX', TTL_SECONDS)
      return token
    },

    async read<T>(clinicId: string, token: string) {
      const raw = await redis.get(key(clinicId, token))
      return raw === null ? null : (JSON.parse(raw) as T)
    },

    async close() {
      await redis.quit()
    },
  }
}
