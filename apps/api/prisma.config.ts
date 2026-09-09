// Prisma 7 dan boshlab ulanish manzili sxemada emas, shu yerda turadi.
// Muhit oʻzgaruvchilari repozitoriya ildizidagi bitta .env da.

import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, env } from 'prisma/config'

// Konteynerda .env yoʻq — oʻzgaruvchilar compose dan keladi. Fayl bor
// boʻlsagina oʻqiymiz, aks holda qurish bosqichi shu yerda yiqilardi
if (!process.env.DATABASE_URL) {
  const envFile = fileURLToPath(new URL('../../.env', import.meta.url))
  if (existsSync(envFile)) process.loadEnvFile(envFile)
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
