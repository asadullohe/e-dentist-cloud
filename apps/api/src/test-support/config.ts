// Testlar uchun yagona konfiguratsiya. Yangi sozlama qoʻshilganda uchta
// joyda emas, faqat shu yerda yangilanadi.

import type { Config } from '../platform/config.js'

export function testConfig(overrides: Partial<Config> = {}): Config {
  return {
    NODE_ENV: 'test',
    API_PORT: 3000,
    TZ: 'Asia/Tashkent',
    CABINET_URL: 'http://localhost:5173',
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://x',
    APP_DATABASE_URL: process.env.APP_DATABASE_URL ?? 'postgresql://x',
    REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
    SESSION_SECRET: 'x'.repeat(16),
    S3_ENDPOINT: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? 'edentist',
    S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? 'lokal_parol_2026',
    S3_BUCKET: process.env.S3_BUCKET ?? 'edentist-test',
    SMTP_PORT: 587,
    ...overrides,
  }
}

/// Bazaga ham, saqlagichga ham tegmaydigan testlar uchun
export const fakeStorage = {
  ensureBucket: async () => {},
  put: async () => {},
  get: async () => null,
  signedUrl: async () => 'http://sinov/imzolangan-havola',
  remove: async () => {},
}

/// Redis ga tegmaydigan testlar uchun
export const fakeImports = {
  save: async () => 'sinov-token',
  read: async () => null,
  close: async () => {},
}
