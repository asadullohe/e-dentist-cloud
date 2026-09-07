import { yuklaConfig } from './platform/config.js'
import { yaratServer } from './platform/server.js'
import { tekshirVaqtZonasi } from './platform/tz.js'

const config = yuklaConfig()
tekshirVaqtZonasi(config.TZ)

const app = yaratServer(config)

// Docker konteynerni toʻxtatganda ochiq soʻrovlar tugashini kutamiz
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    app.close().then(
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
