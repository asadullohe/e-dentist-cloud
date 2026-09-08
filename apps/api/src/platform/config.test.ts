import { describe, expect, it } from 'vitest'
import { loadConfig } from './config.js'

const full = {
  DATABASE_URL: 'postgresql://edentist:x@localhost:5433/edentist',
  APP_DATABASE_URL: 'postgresql://edentist_app:x@localhost:5433/edentist',
  REDIS_URL: 'redis://localhost:6379',
  SESSION_SECRET: 'x'.repeat(16),
  S3_ENDPOINT: 'http://localhost:9000',
  S3_ACCESS_KEY: 'edentist',
  S3_SECRET_KEY: 'parol',
  S3_BUCKET: 'edentist-files',
}

describe('loadConfig', () => {
  it('sukut qiymatlarni oʻzi qoʻyadi', () => {
    const c = loadConfig(full)
    expect(c.NODE_ENV).toBe('development')
    expect(c.API_PORT).toBe(3000)
    expect(c.TZ).toBe('Asia/Tashkent')
  })

  it('portni matndan songa oʻgiradi', () => {
    expect(loadConfig({ ...full, API_PORT: '8080' }).API_PORT).toBe(8080)
  })

  it('majburiy oʻzgaruvchi yoʻq boʻlsa server koʻtarilmaydi', () => {
    expect(() => loadConfig({ REDIS_URL: 'redis://x', SESSION_SECRET: 'x'.repeat(16) })).toThrow(
      /DATABASE_URL/,
    )
  })

  it('ishga tushirish ulanishi ham majburiy — usiz RLS himoyasi yoʻq', () => {
    const { APP_DATABASE_URL: _, ...withoutApp } = full
    expect(() => loadConfig(withoutApp)).toThrow(/APP_DATABASE_URL/)
  })

  it('qisqa sessiya sirini rad etadi', () => {
    expect(() => loadConfig({ ...full, SESSION_SECRET: 'qisqa' })).toThrow(/SESSION_SECRET/)
  })
})
