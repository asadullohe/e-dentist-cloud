// Fastify ilovasini yasaydi. Ishga tushirish index.ts da — shunda testlar
// serverni portga bogʻlamasdan, app.inject() bilan tekshira oladi.

import { randomUUID } from 'node:crypto'
import { IMAGE_TEXT } from '@e-dentist/shared'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import { adminRoutes } from '../modules/admin/routes.js'
import { authRoutes } from '../modules/auth/routes.js'
import * as auth from '../modules/auth/service.js'
import * as billing from '../modules/billing/service.js'
import { clinicRoutes } from '../modules/clinics/routes.js'
import { expenseRoutes } from '../modules/expenses/routes.js'
import { exportRoutes } from '../modules/export/routes.js'
import { healthRoutes } from '../modules/health/routes.js'
import { labRoutes } from '../modules/lab/routes.js'
import { patientRoutes } from '../modules/patients/routes.js'
import { paymentRoutes } from '../modules/payments/routes.js'
import { reportRoutes } from '../modules/reports/routes.js'
import { queueRoutes } from '../modules/schedule/queueRoutes.js'
import { scheduleRoutes } from '../modules/schedule/routes.js'
import { serviceRoutes } from '../modules/services/routes.js'
import { visitRoutes } from '../modules/visits/routes.js'
import type { Bus } from './bus.js'
import type { Config } from './config.js'
import type { Db } from './db.js'
import { AppError, errors } from './errors.js'
import { anyPermissionGuard, permissionGuard, sessionHook } from './guards.js'
import type { ImportStore } from './importStore.js'
import type { Mailer } from './mailer.js'
import type { Notifier } from './notify.js'
import type { RateLimiter } from './rateLimit.js'
import { errorResponse } from './response.js'
import type { SessionStore } from './session.js'
import type { Storage } from './storage.js'

export interface ServerDeps {
  db: Db
  storage: Storage
  imports: ImportStore
  sessions: SessionStore
  rateLimiter: RateLimiter
  mailer: Mailer
  /// Navbat oʻzgarganda ochiq sahifalarga xabar beradi (SSE)
  bus: Bus
  /// Platforma egasiga Telegram xabari
  notify: Notifier
}

// Har qanday xatoni AppXato ga keltiradi. Foydalanuvchi hech qachon
// texnik tafsilotni koʻrmaydi — u faqat logga tushadi.
/// Bemor rasmlari uchun eng katta hajm. Xizmat qatlamida ham tekshiriladi
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err
  // Error boʻlmagan narsa ham otilishi mumkin (`throw 'matn'`)
  if (!(err instanceof Error)) return errors.internal(err)

  const f = err as FastifyError

  // Fastify sxema tekshiruvi. Xabarlari inglizcha boʻlgani uchun javobga
  // qoʻshilmaydi — umumiy oʻzbekcha matn ketadi, tafsilot logda qoladi
  if (f.validation) return errors.validation({})

  if (f.statusCode === 429) return errors.rateLimited()
  // @fastify/multipart chegaradan oshgan faylni shu kod bilan rad etadi
  if (f.statusCode === 413) return errors.badRequest(IMAGE_TEXT.too_large)
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
    // IP boʻyicha cheklash shunga tayanadi (1.14).
    //
    // `true` emas: faqat bevosita qoʻshni — Caddy — ishonchli deb
    // olinadi (hop 0). `true` boʻlsa mijoz yuborgan X-Forwarded-For
    // zanjirining boshi ham hisobga olinardi va cheklovni soxta IP
    // bilan aylanib oʻtish mumkin boʻlardi
    trustProxy: config.NODE_ENV === 'production' ? (_address, hop) => hop === 0 : false,
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
  // Bemor rasmlari uchun. Chegara shu yerda ham qoʻyiladi: katta fayl
  // butunlay oʻqilguncha kutib oʻtirilmaydi
  app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } })
  app.addHook('onRequest', sessionHook(deps.sessions))

  // Obuna tekshiruvi. Oʻqish har doim ochiq — muddat tugasa ham klinika
  // oʻz maʼlumotini koʻradi va eksport qiladi (tz.md 8-boʻlim).
  // Chiqish ham ochiq: yopiq kabinetdan chiqa olmaslik maʼnosiz
  const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])
  const BILLING_FREE = ['/api/auth/', '/api/n/']

  app.addHook('preHandler', async (req) => {
    if (!WRITE_METHODS.has(req.method)) return
    const clinicId = req.session?.clinicId
    if (!clinicId) return
    if (BILLING_FREE.some((prefix) => req.url.startsWith(prefix))) return

    await billing.assertWritable({ db: deps.db }, clinicId)
  })

  app.register(healthRoutes, { prefix: '/api', deps: { db: deps.db, sessions: deps.sessions } })
  // Ruxsat tekshiruvi barcha marshrutlarga ochiladi:
  //   preHandler: app.talabRuxsat('patients.read')
  // Ruxsatlar clinics modulidan oʻqiladi — platform modullarni import qilmaydi,
  // shuning uchun funksiya shu yerda bogʻlanadi
  const loadPermissions = (clinicId: string, userId: string) =>
    auth.userPermissions(deps.db, clinicId, userId)
  app.decorate('requirePermission', permissionGuard(loadPermissions))
  app.decorate('requireAnyPermission', anyPermissionGuard(loadPermissions))

  app.register(authRoutes, {
    prefix: '/api',
    deps: {
      db: deps.db,
      sessions: deps.sessions,
      rateLimiter: deps.rateLimiter,
      mailer: deps.mailer,
      notify: deps.notify,
      cabinetUrl: config.CABINET_URL,
      log: (message, meta) => app.log.warn(meta ?? {}, message),
    },
    secureCookie: config.NODE_ENV === 'production',
  })
  app.register(patientRoutes, {
    prefix: '/api',
    deps: { db: deps.db, storage: deps.storage, imports: deps.imports },
  })
  app.register(visitRoutes, { prefix: '/api', deps: { db: deps.db } })
  app.register(paymentRoutes, { prefix: '/api', deps: { db: deps.db } })
  app.register(serviceRoutes, { prefix: '/api', deps: { db: deps.db } })
  app.register(scheduleRoutes, { prefix: '/api', deps: { db: deps.db } })
  // Navbat marshrutlari ochiq: /api/n/<kod>
  app.register(queueRoutes, {
    prefix: '/api',
    deps: { db: deps.db, rateLimiter: deps.rateLimiter, bus: deps.bus },
    secureCookie: config.NODE_ENV === 'production',
  })
  app.register(expenseRoutes, { prefix: '/api', deps: { db: deps.db } })
  app.register(reportRoutes, { prefix: '/api', deps: { db: deps.db } })
  app.register(clinicRoutes, { prefix: '/api', deps: { db: deps.db, storage: deps.storage } })
  app.register(adminRoutes, {
    prefix: '/api',
    deps: {
      db: deps.db,
      mailer: deps.mailer,
      cabinetUrl: config.CABINET_URL,
      storage: deps.storage,
    },
  })
  app.register(labRoutes, { prefix: '/api', deps: { db: deps.db } })
  app.register(exportRoutes, { prefix: '/api', deps: { db: deps.db } })

  return app
}
