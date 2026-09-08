// Fastify ilovasini yasaydi. Ishga tushirish index.ts da — shunda testlar
// serverni portga bogʻlamasdan, app.inject() bilan tekshira oladi.

import { randomUUID } from 'node:crypto'
import cookie from '@fastify/cookie'
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import { authRoutes } from '../modules/auth/routes.js'
import * as auth from '../modules/auth/service.js'
import { healthRoutes } from '../modules/health/routes.js'
import { patientRoutes } from '../modules/patients/routes.js'
import { visitRoutes } from '../modules/visits/routes.js'
import type { Config } from './config.js'
import type { Db } from './db.js'
import { AppError, errors } from './errors.js'
import { permissionGuard, sessionHook } from './guards.js'
import type { Mailer } from './mailer.js'
import type { RateLimiter } from './rateLimit.js'
import { errorResponse } from './response.js'
import type { SessionStore } from './session.js'

export interface ServerDeps {
  db: Db
  sessions: SessionStore
  rateLimiter: RateLimiter
  mailer: Mailer
}

// Har qanday xatoni AppXato ga keltiradi. Foydalanuvchi hech qachon
// texnik tafsilotni koʻrmaydi — u faqat logga tushadi.
function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err
  // Error boʻlmagan narsa ham otilishi mumkin (`throw 'matn'`)
  if (!(err instanceof Error)) return errors.internal(err)

  const f = err as FastifyError

  // Fastify sxema tekshiruvi. Xabarlari inglizcha boʻlgani uchun javobga
  // qoʻshilmaydi — umumiy oʻzbekcha matn ketadi, tafsilot logda qoladi
  if (f.validation) return errors.validation({})

  if (f.statusCode === 429) return errors.rateLimited()
  if (f.statusCode && f.statusCode >= 400 && f.statusCode < 500) return errors.badRequest()

  return errors.internal(err)
}

function loggerOptions(config: Config) {
  if (config.NODE_ENV === 'test') return false
  if (config.NODE_ENV === 'production') return { level: 'info' }
  return {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
    },
  }
}

export function createServer(config: Config, deps: ServerDeps): FastifyInstance {
  const app = Fastify({
    logger: loggerOptions(config),
    // Soʻrov identifikatori har logda boʻlsin: tibbiy maʼlumot bilan
    // ishlaydigan serverda xatoni izlash imkoni boʻlishi shart
    genReqId: () => randomUUID(),
    // Caddy orqasida haqiqiy IP koʻrinishi uchun. Kirish urinishlarini
    // IP boʻyicha cheklash shunga tayanadi (1.14)
    trustProxy: config.NODE_ENV === 'production',
  })

  app.setErrorHandler((err, req, reply) => {
    const e = toAppError(err)
    if (e.status >= 500) req.log.error({ err }, 'kutilmagan xato')
    else req.log.warn({ err, code: e.code }, 'soʻrov rad etildi')
    reply.status(e.status).send(errorResponse(e))
  })

  // Mavjud boʻlmagan manzil ham bir xil shaklda javob beradi
  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send(errorResponse(errors.notFound()))
  })

  app.register(cookie)
  app.addHook('onRequest', sessionHook(deps.sessions))

  app.register(healthRoutes, { prefix: '/api' })
  // Ruxsat tekshiruvi barcha marshrutlarga ochiladi:
  //   preHandler: app.talabRuxsat('patients.read')
  // Ruxsatlar clinics modulidan oʻqiladi — platform modullarni import qilmaydi,
  // shuning uchun funksiya shu yerda bogʻlanadi
  app.decorate(
    'requirePermission',
    permissionGuard((clinicId, userId) => auth.userPermissions(deps.db, clinicId, userId)),
  )

  app.register(authRoutes, {
    prefix: '/api',
    deps: {
      db: deps.db,
      sessions: deps.sessions,
      rateLimiter: deps.rateLimiter,
      mailer: deps.mailer,
      cabinetUrl: config.CABINET_URL,
      log: (message, meta) => app.log.warn(meta ?? {}, message),
    },
    secureCookie: config.NODE_ENV === 'production',
  })
  app.register(patientRoutes, { prefix: '/api', deps: { db: deps.db } })
  app.register(visitRoutes, { prefix: '/api', deps: { db: deps.db } })

  return app
}
