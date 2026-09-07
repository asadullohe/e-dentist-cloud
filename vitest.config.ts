import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

// Koʻp ijarachilik testlari haqiqiy bazaga ulanadi — muhit oʻzgaruvchilari
// ildizdagi .env dan olinadi
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      APP_DATABASE_URL: process.env.APP_DATABASE_URL ?? '',
      TZ: process.env.TZ ?? 'Asia/Tashkent',
    },
  },
})
