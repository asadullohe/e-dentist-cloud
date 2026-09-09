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

describe('pochta sozlamalari', () => {
  const base = {
    DATABASE_URL: 'postgresql://x',
    APP_DATABASE_URL: 'postgresql://x',
    REDIS_URL: 'redis://x',
    SESSION_SECRET: 'x'.repeat(16),
    S3_ENDPOINT: 'http://x',
    S3_ACCESS_KEY: 'x',
    S3_SECRET_KEY: 'x',
    S3_BUCKET: 'x',
  }

  it('lokalda SMTP shart emas — xat konsolga chiqadi', () => {
    expect(() => loadConfig({ ...base } as NodeJS.ProcessEnv)).not.toThrow()
  })

  // Xatsiz roʻyxatdan oʻtish oqimi butunlay ishlamaydi: kabinet pochta
  // tasdigʻisiz ochilmaydi. Shuning uchun server koʻtarilmagani maʼqul
  it('ishlab chiqarishda SMTP sozlanmagan boʻlsa server koʻtarilmaydi', () => {
    expect(() => loadConfig({ ...base, NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow(
      /SMTP_HOST/,
    )
  })

  it('ishlab chiqarishda toʻliq SMTP bilan koʻtariladi', () => {
    expect(() =>
      loadConfig({
        ...base,
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'bot',
        SMTP_PASSWORD: 'parol',
        SMTP_FROM: 'E-Dentist <bot@e-dentist.uz>',
      } as NodeJS.ProcessEnv),
    ).not.toThrow()
  })
})
