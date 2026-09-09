import { createBus } from './platform/bus.js'
import { loadConfig } from './platform/config.js'
import { createDb } from './platform/db.js'
import { createImportStore } from './platform/importStore.js'
import { consoleMailer, type Mailer, smtpMailer } from './platform/mailer.js'
import { type Notifier, silentNotifier, telegramNotifier } from './platform/notify.js'
import { createRateLimiter } from './platform/rateLimit.js'
import { createServer } from './platform/server.js'
import { createSessionStore } from './platform/session.js'
import { createStorage } from './platform/storage.js'
import { assertTimezone } from './platform/timezone.js'

const config = loadConfig()
assertTimezone(config.TZ)

// Ishga tushirishda cheklangan ulanish — RLS ostida. DATABASE_URL (egasi)
// faqat migratsiya va seed uchun
const db = createDb(config.APP_DATABASE_URL)
const sessions = createSessionStore(config.REDIS_URL)
const rateLimiter = createRateLimiter(config.REDIS_URL)

const storage = createStorage({
  endpoint: config.S3_ENDPOINT,
  accessKey: config.S3_ACCESS_KEY,
  secretKey: config.S3_SECRET_KEY,
  bucket: config.S3_BUCKET,
})
// Bucket yoʻq boʻlsa yaratiladi — birinchi ishga tushirishda qoʻlda
// sozlash kerak boʻlmasin
await storage.ensureBucket()

const imports = createImportStore(config.REDIS_URL)
const bus = createBus(config.REDIS_URL)

// Prod da SMTP majburiy — config uni tekshiradi. Lokalda xat konsolga chiqadi
const mailer: Mailer =
  config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASSWORD && config.SMTP_FROM
    ? smtpMailer({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        user: config.SMTP_USER,
        password: config.SMTP_PASSWORD,
        from: config.SMTP_FROM,
      })
    : consoleMailer((message) => app.log.info(message))

// Telegram sozlanmagan boʻlsa xabar yuborilmaydi — bu xato emas
const notify: Notifier =
  config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_CHAT_ID
    ? telegramNotifier({
        token: config.TELEGRAM_BOT_TOKEN,
        chatId: config.TELEGRAM_CHAT_ID,
        log: (message, meta) => app.log.warn(meta ?? {}, message),
      })
    : silentNotifier()

const app = createServer(config, {
  db,
  storage,
  imports,
  sessions,
  rateLimiter,
  mailer,
  notify,
  bus,
})

// Docker konteynerni toʻxtatganda ochiq soʻrovlar tugashini kutamiz
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    Promise.allSettled([
      app.close(),
      sessions.close(),
      rateLimiter.close(),
      imports.close(),
      bus.close(),
      db.$disconnect(),
    ]).then(
      () => process.exit(0),
      () => process.exit(1),
    )
  })
}

try {
  await app.listen({ port: config.API_PORT, host: '0.0.0.0' })
} catch (e) {
  app.log.error(e, 'server koʻtarilmadi')
  process.exit(1)
}
