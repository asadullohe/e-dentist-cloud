// Hodisalar shinasi: navbat oʻzgarganda ochiq sahifalarga xabar beriladi.
//
// Nega Redis pub/sub, oddiy EventEmitter emas: SSE ulanishi bitta jarayonga
// bogʻlanadi. Server ikkita nusxada koʻtarilsa (yoki keyin koʻtarilsa),
// jarayon ichidagi emitter bilan mijozlarning yarmi yangilanishni umuman
// olmaydi — va bu jimgina yuz beradi. Redis allaqachon bor.
//
// Xabarning oʻzi ataylab boʻsh: «shu klinikada navbat oʻzgardi». Mijoz
// oʻzi kerakli soʻrovni qaytadan yuboradi, shuning uchun maxfiylik
// filtrlari bitta joyda — marshrutlarda qoladi.

import { Redis } from 'ioredis'

export type BusHandler = () => void

export interface Bus {
  publish(channel: string): Promise<void>
  /// Obunani bekor qiluvchi funksiya qaytadi
  subscribe(channel: string, handler: BusHandler): () => void
  close(): Promise<void>
}

export function queueChannel(clinicId: string): string {
  return `queue:${clinicId}`
}

export function createBus(redisUrl: string): Bus {
  const publisher = new Redis(redisUrl)
  // Obuna rejimidagi ulanish boshqa buyruqlarni bajara olmaydi — shuning
  // uchun ikkinchi ulanish
  const subscriber = new Redis(redisUrl)
  const handlers = new Map<string, Set<BusHandler>>()

  subscriber.on('message', (channel) => {
    for (const handler of handlers.get(channel) ?? []) handler()
  })

  return {
    async publish(channel) {
      await publisher.publish(channel, '1')
    },

    subscribe(channel, handler) {
      const existing = handlers.get(channel)
      if (existing) {
        existing.add(handler)
      } else {
        handlers.set(channel, new Set([handler]))
        void subscriber.subscribe(channel)
      }

      return () => {
        const set = handlers.get(channel)
        if (!set) return
        set.delete(handler)
        if (set.size === 0) {
          handlers.delete(channel)
          void subscriber.unsubscribe(channel)
        }
      }
    },

    async close() {
      handlers.clear()
      await Promise.allSettled([publisher.quit(), subscriber.quit()])
    },
  }
}

/// Testlar uchun: Redis siz, bitta jarayon ichida.
/// `subscriberCount` — ulanish yopilganda obuna tozalanganini tekshirish uchun
export function memoryBus(): Bus & { subscriberCount(channel: string): number } {
  const handlers = new Map<string, Set<BusHandler>>()

  return {
    async publish(channel) {
      for (const handler of handlers.get(channel) ?? []) handler()
    },
    subscribe(channel, handler) {
      const set = handlers.get(channel) ?? new Set()
      set.add(handler)
      handlers.set(channel, set)
      return () => set.delete(handler)
    },
    async close() {
      handlers.clear()
    },
    subscriberCount(channel) {
      return handlers.get(channel)?.size ?? 0
    },
  }
}
