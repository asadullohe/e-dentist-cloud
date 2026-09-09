// Muhit oʻzgaruvchilari. Notoʻgʻri boʻlsa server umuman koʻtarilmaydi —
// yarim sozlangan holatda ishga tushib, keyin bemor maʼlumoti bilan
// xato qilgandan koʻra darhol toʻxtagani yaxshi.

import { z } from 'zod'

const Schema = z
  .object({
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

    // Fayl saqlagich
    S3_ENDPOINT: z.string().min(1),
    S3_ACCESS_KEY: z.string().min(1),
    S3_SECRET_KEY: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    // Tasdiqlash havolasi shu manzilga qurilaadi
    CABINET_URL: z.string().min(1).default('http://localhost:5173'),

    // Pochta. Lokalda boʻsh — xat konsolga chiqadi
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().optional(),

    // Telegram xabarnomasi. Boʻsh boʻlsa xabar yuborilmaydi
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_CHAT_ID: z.string().optional(),
  })
  .refine(
    (config) =>
      config.NODE_ENV !== 'production' ||
      Boolean(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASSWORD && config.SMTP_FROM),
    {
      // Xatsiz roʻyxatdan oʻtish oqimi butunlay ishlamaydi: kabinet
      // pochta tasdigʻisiz ochilmaydi
      message: 'ishlab chiqarishda SMTP_HOST, SMTP_USER, SMTP_PASSWORD va SMTP_FROM shart',
      path: ['SMTP_HOST'],
    },
  )

export type Config = z.infer<typeof Schema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = Schema.safeParse(env)
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join('.') || '?'} — ${i.message}`)
    throw new Error(`Muhit oʻzgaruvchilari notoʻgʻri:\n${lines.join('\n')}`)
  }
  return result.data
}
