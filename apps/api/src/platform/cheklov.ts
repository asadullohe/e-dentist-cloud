// Urinishlar cheklovi. Redis da oddiy hisoblagich: kalit boʻyicha nechta
// urinish boʻlgani sanaladi va oyna tugagach oʻzi oʻchadi.
//
// Nega Redis: hisoblagich serverni qayta ishga tushirganda ham qolishi kerak,
// va keyinchalik bir nechta jarayon boʻlsa ham bitta hisob boʻlsin.

import { Redis } from 'ioredis'

export interface CheklovNatijasi {
  ruxsat: boolean
  /// Oyna tugashiga necha soniya qolgani — foydalanuvchiga aytish uchun
  qolganSoniya: number
}

export interface Cheklagich {
  urin(kalit: string, chegara: number, oynaSoniya: number): Promise<CheklovNatijasi>
  tozala(kalit: string): Promise<void>
  yop(): Promise<void>
}

export function yaratCheklagich(redisUrl: string): Cheklagich {
  const redis = new Redis(redisUrl)
  const k = (kalit: string) => `cheklov:${kalit}`

  return {
    async urin(kalit, chegara, oynaSoniya) {
      const soni = await redis.incr(k(kalit))
      // Birinchi urinishda oyna boshlanadi
      if (soni === 1) await redis.expire(k(kalit), oynaSoniya)
      const ttl = await redis.ttl(k(kalit))
      return { ruxsat: soni <= chegara, qolganSoniya: ttl > 0 ? ttl : oynaSoniya }
    },

    // Muvaffaqiyatli kirishdan keyin hisob tozalanadi: notoʻgʻri parol
    // yozib qoʻygan odam keyingi safar toʻsiqqa uchramasin
    async tozala(kalit) {
      await redis.del(k(kalit))
    },

    async yop() {
      await redis.quit()
    },
  }
}
