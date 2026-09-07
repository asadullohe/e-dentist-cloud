import { describe, expect, it } from 'vitest'
import { yuklaConfig } from './config.js'

const toliq = {
  DATABASE_URL: 'postgresql://edentist:x@localhost:5433/edentist',
  APP_DATABASE_URL: 'postgresql://edentist_app:x@localhost:5433/edentist',
  REDIS_URL: 'redis://localhost:6379',
  SESSION_SECRET: 'x'.repeat(16),
}

describe('yuklaConfig', () => {
  it('sukut qiymatlarni oʻzi qoʻyadi', () => {
    const c = yuklaConfig(toliq)
    expect(c.NODE_ENV).toBe('development')
    expect(c.API_PORT).toBe(3000)
    expect(c.TZ).toBe('Asia/Tashkent')
  })

  it('portni matndan songa oʻgiradi', () => {
    expect(yuklaConfig({ ...toliq, API_PORT: '8080' }).API_PORT).toBe(8080)
  })

  it('majburiy oʻzgaruvchi yoʻq boʻlsa server koʻtarilmaydi', () => {
    expect(() => yuklaConfig({ REDIS_URL: 'redis://x', SESSION_SECRET: 'x'.repeat(16) })).toThrow(
      /DATABASE_URL/,
    )
  })

  it('ishga tushirish ulanishi ham majburiy — usiz RLS himoyasi yoʻq', () => {
    const { APP_DATABASE_URL: _, ...appsiz } = toliq
    expect(() => yuklaConfig(appsiz)).toThrow(/APP_DATABASE_URL/)
  })

  it('qisqa sessiya sirini rad etadi', () => {
    expect(() => yuklaConfig({ ...toliq, SESSION_SECRET: 'qisqa' })).toThrow(/SESSION_SECRET/)
  })
})
