import { formatDateTime, todayISO } from '@e-dentist/shared'
import type { FastifyPluginAsync } from 'fastify'
import type { Db } from '../../platform/db.js'
import { ok } from '../../platform/response.js'
import type { SessionStore } from '../../platform/session.js'

export interface HealthRouteOpts {
  deps: {
    db: Db
    sessions: SessionStore
  }
}

export const healthRoutes: FastifyPluginAsync<HealthRouteOpts> = async (app, opts) => {
  // Serverning sanasi ham qaytadi: vaqt zonasi Asia/Tashkent ekanini
  // bir qarashda tekshirib olish uchun
  app.get('/health', async () =>
    ok({
      status: 'ok',
      date: todayISO(),
      time: formatDateTime(new Date()),
    }),
  )

  // Kuzatuv shu manzilni soʻraydi (Uptime Kuma). `/health` dan farqi:
  // baza va Redis ham tekshiriladi. Ular yotgan boʻlsa API «tirik» deb
  // koʻrinib turishi kuzatuvni behuda qiladi.
  //
  // Javobda tafsilot yoʻq — manzil ochiq, qaysi qism yiqilgani logda
  app.get('/health/ready', async (_req, reply) => {
    const checks = await Promise.allSettled([
      opts.deps.db.$queryRaw`SELECT 1`,
      opts.deps.sessions.ping(),
    ])

    const broken = checks
      .map((result, index) => ({ result, name: index === 0 ? 'postgres' : 'redis' }))
      .filter((item) => item.result.status === 'rejected')

    if (broken.length > 0) {
      for (const item of broken) {
        app.log.error(
          { err: (item.result as PromiseRejectedResult).reason },
          `${item.name} javob bermadi`,
        )
      }
      return reply.status(503).send({ ok: false, error: { code: 'unavailable', message: '' } })
    }

    return ok({ status: 'ok' })
  })
}
