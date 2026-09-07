import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { type Cheklagich, yaratCheklagich } from './cheklov.js'

const cheklagich: Cheklagich = yaratCheklagich(process.env.REDIS_URL ?? 'redis://localhost:6379')

afterAll(async () => {
  await cheklagich.yop()
})

describe('cheklagich', () => {
  it('chegaragacha ruxsat beradi, undan keyin yoʻq', async () => {
    const kalit = randomUUID()
    for (let i = 0; i < 3; i++) {
      expect((await cheklagich.urin(kalit, 3, 60)).ruxsat).toBe(true)
    }
    expect((await cheklagich.urin(kalit, 3, 60)).ruxsat).toBe(false)
    await cheklagich.tozala(kalit)
  })

  it('tozalangandan keyin hisob noldan boshlanadi', async () => {
    const kalit = randomUUID()
    await cheklagich.urin(kalit, 1, 60)
    expect((await cheklagich.urin(kalit, 1, 60)).ruxsat).toBe(false)

    await cheklagich.tozala(kalit)
    expect((await cheklagich.urin(kalit, 1, 60)).ruxsat).toBe(true)
    await cheklagich.tozala(kalit)
  })

  it('kalitlar bir-biriga aralashmaydi', async () => {
    const a = randomUUID()
    const b = randomUUID()
    await cheklagich.urin(a, 1, 60)
    expect((await cheklagich.urin(b, 1, 60)).ruxsat).toBe(true)
    await cheklagich.tozala(a)
    await cheklagich.tozala(b)
  })

  it('oyna tugash vaqtini qaytaradi', async () => {
    const kalit = randomUUID()
    const n = await cheklagich.urin(kalit, 5, 120)
    expect(n.qolganSoniya).toBeGreaterThan(100)
    expect(n.qolganSoniya).toBeLessThanOrEqual(120)
    await cheklagich.tozala(kalit)
  })
})
