import { yaratCheklagich } from './platform/cheklov.js'
import { yuklaConfig } from './platform/config.js'
import { yaratDb } from './platform/db.js'
import { konsolPochtasi } from './platform/pochta.js'
import { yaratServer } from './platform/server.js'
import { yaratSessiyaSaqlagich } from './platform/sessiya.js'
import { tekshirVaqtZonasi } from './platform/tz.js'

const config = yuklaConfig()
tekshirVaqtZonasi(config.TZ)

// Ishga tushirishda cheklangan ulanish — RLS ostida. DATABASE_URL (egasi)
// faqat migratsiya va seed uchun
const db = yaratDb(config.APP_DATABASE_URL)
const sessiyalar = yaratSessiyaSaqlagich(config.REDIS_URL)
const cheklagich = yaratCheklagich(config.REDIS_URL)

const app = yaratServer(config, {
  db,
  sessiyalar,
  cheklagich,
  pochta: konsolPochtasi((xabar) => app.log.info(xabar)),
})

// Docker konteynerni toʻxtatganda ochiq soʻrovlar tugashini kutamiz
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    Promise.allSettled([app.close(), sessiyalar.yop(), cheklagich.yop(), db.$disconnect()]).then(
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
