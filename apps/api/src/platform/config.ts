// Muhit oʻzgaruvchilari. Notoʻgʻri boʻlsa server umuman koʻtarilmaydi —
// yarim sozlangan holatda ishga tushib, keyin bemor maʼlumoti bilan
// xato qilgandan koʻra darhol toʻxtagani yaxshi.

import { z } from 'zod'

const Schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  // Sanalar shu zonaga tayanadi — platform/tz.ts ga qarang
  TZ: z.string().default('Asia/Tashkent'),
  // Migratsiya va seed — egasi (superuser), RLS unga taʼsir qilmaydi
  DATABASE_URL: z.string().min(1),
  // Ishga tushirish — cheklangan foydalanuvchi, RLS ostida.
  // Superuser bilan ulansak siyosatlar bezak boʻlib qoladi
  APP_DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16, 'kamida 16 belgi boʻlishi kerak'),
  // Tasdiqlash havolasi shu manzilga qurilaadi
  CABINET_URL: z.string().min(1).default('http://localhost:5173'),
})

export type Config = z.infer<typeof Schema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = Schema.safeParse(env)
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join('.') || '?'} — ${i.message}`)
    throw new Error(`Muhit oʻzgaruvchilari notoʻgʻri:\n${lines.join('\n')}`)
  }
  return result.data
}
