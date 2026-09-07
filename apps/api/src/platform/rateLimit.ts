// Urinishlar cheklovi. Redis da oddiy hisoblagich: kalit boʻyicha nechta
// urinish boʻlgani sanaladi va oyna tugagach oʻzi oʻchadi.
//
// Nega Redis: hisoblagich serverni qayta ishga tushirganda ham qolishi kerak,
// va keyinchalik bir nechta jarayon boʻlsa ham bitta hisob boʻlsin.

import { Redis } from 'ioredis'

export interface RateLimitResult {
  allowed: boolean
  /// Oyna tugashiga necha soniya qolgani — foydalanuvchiga aytish uchun
  resetInSeconds: number
}

export interface RateLimiter {
  hit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>
  reset(key: string): Promise<void>
  close(): Promise<void>
}

export function createRateLimiter(redisUrl: string): RateLimiter {
  const redis = new Redis(redisUrl)
  const k = (key: string) => `ratelimit:${key}`

  return {
    async hit(key, limit, windowSeconds) {
      const count = await redis.incr(k(key))
      // Birinchi urinishda oyna boshlanadi
      if (count === 1) await redis.expire(k(key), windowSeconds)
      const ttl = await redis.ttl(k(key))
      return { allowed: count <= limit, resetInSeconds: ttl > 0 ? ttl : windowSeconds }
    },

    // Muvaffaqiyatli kirishdan keyin hisob tozalanadi: notoʻgʻri parol
    // yozib qoʻygan odam keyingi safar toʻsiqqa uchramasin
    async reset(key) {
      await redis.del(k(key))
    },

    async close() {
      await redis.quit()
    },
  }
}
