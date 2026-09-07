import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { createRateLimiter, type RateLimiter } from './rateLimit.js'

const rateLimiter: RateLimiter = createRateLimiter(
  process.env.REDIS_URL ?? 'redis://localhost:6379',
)

afterAll(async () => {
  await rateLimiter.close()
})

describe('cheklagich', () => {
  it('chegaragacha ruxsat beradi, undan keyin yoʻq', async () => {
    const key = randomUUID()
    for (let i = 0; i < 3; i++) {
      expect((await rateLimiter.hit(key, 3, 60)).allowed).toBe(true)
    }
    expect((await rateLimiter.hit(key, 3, 60)).allowed).toBe(false)
    await rateLimiter.reset(key)
  })

  it('tozalangandan keyin hisob noldan boshlanadi', async () => {
    const key = randomUUID()
    await rateLimiter.hit(key, 1, 60)
    expect((await rateLimiter.hit(key, 1, 60)).allowed).toBe(false)

    await rateLimiter.reset(key)
    expect((await rateLimiter.hit(key, 1, 60)).allowed).toBe(true)
    await rateLimiter.reset(key)
  })

  it('kalitlar bir-biriga aralashmaydi', async () => {
    const a = randomUUID()
    const b = randomUUID()
    await rateLimiter.hit(a, 1, 60)
    expect((await rateLimiter.hit(b, 1, 60)).allowed).toBe(true)
    await rateLimiter.reset(a)
    await rateLimiter.reset(b)
  })

  it('oyna tugash vaqtini qaytaradi', async () => {
    const key = randomUUID()
    const n = await rateLimiter.hit(key, 5, 120)
    expect(n.resetInSeconds).toBeGreaterThan(100)
    expect(n.resetInSeconds).toBeLessThanOrEqual(120)
    await rateLimiter.reset(key)
  })
})
