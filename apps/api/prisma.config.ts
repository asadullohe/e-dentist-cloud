// Prisma 7 dan boshlab ulanish manzili sxemada emas, shu yerda turadi.
// Muhit oʻzgaruvchilari repozitoriya ildizidagi bitta .env da.

import { fileURLToPath } from 'node:url'
import { defineConfig, env } from 'prisma/config'

if (!process.env.DATABASE_URL) {
  process.loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)))
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'tsx --env-file=../../.env prisma/seed.ts',
  },
})
