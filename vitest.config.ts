import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

// Koʻp ijarachilik testlari haqiqiy bazaga ulanadi — muhit oʻzgaruvchilari
// ildizdagi .env dan olinadi
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  test: {
    // `.claude/worktrees` da shu reponing nusxasi turishi mumkin — oʻsha
    // yerdagi testlar ikkinchi marta yigʻilib, bazaga urishib ketadi.
    // `.agents` — lokal skillar, ularning testlari bizga tegishli emas
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**', '**/.agents/**'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      APP_DATABASE_URL: process.env.APP_DATABASE_URL ?? '',
      TZ: process.env.TZ ?? 'Asia/Tashkent',
    },
  },
})
