// Fastify ilovasini yasaydi. Ishga tushirish index.ts da — shunda testlar
// serverni portga bogʻlamasdan, app.inject() bilan tekshira oladi.

import { randomUUID } from 'node:crypto'
import cookie from '@fastify/cookie'
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import { authRoutes } from '../modules/auth/routes.js'
import * as auth from '../modules/auth/service.js'
import { healthRoutes } from '../modules/health/routes.js'
import type { Cheklagich } from './cheklov.js'
import type { Config } from './config.js'
import type { Db } from './db.js'
import { AppXato, xato } from './errors.js'
import { xatoJavobi } from './javob.js'
import { ruxsatTekshiruvi, sessiyaHooki } from './kirish.js'
import type { PochtaYuboruvchi } from './pochta.js'
import type { SessiyaSaqlagich } from './sessiya.js'

export interface ServerDeps {
  db: Db
  sessiyalar: SessiyaSaqlagich
  cheklagich: Cheklagich
  pochta: PochtaYuboruvchi
}

// Har qanday xatoni AppXato ga keltiradi. Foydalanuvchi hech qachon
// texnik tafsilotni koʻrmaydi — u faqat logga tushadi.
function appXatoga(err: unknown): AppXato {
  if (err instanceof AppXato) return err
  // Error boʻlmagan narsa ham otilishi mumkin (`throw 'matn'`)
  if (!(err instanceof Error)) return xato.internal(err)

  const f = err as FastifyError

  // Fastify sxema tekshiruvi. Xabarlari inglizcha boʻlgani uchun javobga
  // qoʻshilmaydi — umumiy oʻzbekcha matn ketadi, tafsilot logda qoladi
  if (f.validation) return xato.validation({})

  if (f.statusCode === 429) return xato.rateLimited()
  if (f.statusCode && f.statusCode >= 400 && f.statusCode < 500) return xato.badRequest()

  return xato.internal(err)
}

function loggerSozlamasi(config: Config) {
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

export function yaratServer(config: Config, deps: ServerDeps): FastifyInstance {
  const app = Fastify({
    logger: loggerSozlamasi(config),
    // Soʻrov identifikatori har logda boʻlsin: tibbiy maʼlumot bilan
    // ishlaydigan serverda xatoni izlash imkoni boʻlishi shart
    genReqId: () => randomUUID(),
    // Caddy orqasida haqiqiy IP koʻrinishi uchun. Kirish urinishlarini
    // IP boʻyicha cheklash shunga tayanadi (1.14)
    trustProxy: config.NODE_ENV === 'production',
  })

  app.setErrorHandler((err, req, reply) => {
    const e = appXatoga(err)
    if (e.status >= 500) req.log.error({ err }, 'kutilmagan xato')
    else req.log.warn({ err, code: e.code }, 'soʻrov rad etildi')
    reply.status(e.status).send(xatoJavobi(e))
  })

  // Mavjud boʻlmagan manzil ham bir xil shaklda javob beradi
  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send(xatoJavobi(xato.notFound()))
  })

  app.register(cookie)
  app.addHook('onRequest', sessiyaHooki(deps.sessiyalar))

  app.register(healthRoutes, { prefix: '/api' })
  // Ruxsat tekshiruvi barcha marshrutlarga ochiladi:
  //   preHandler: app.talabRuxsat('patients.read')
  // Ruxsatlar clinics modulidan oʻqiladi — platform modullarni import qilmaydi,
  // shuning uchun funksiya shu yerda bogʻlanadi
  app.decorate(
    'talabRuxsat',
    ruxsatTekshiruvi((clinicId, userId) => auth.foydalanuvchiRuxsatlari(deps.db, clinicId, userId)),
  )

  app.register(authRoutes, {
    prefix: '/api',
    deps: {
      db: deps.db,
      sessiyalar: deps.sessiyalar,
      cheklagich: deps.cheklagich,
      pochta: deps.pochta,
      cabinetUrl: config.CABINET_URL,
      log: (xabar, maʼlumot) => app.log.warn(maʼlumot ?? {}, xabar),
    },
    xavfsizCookie: config.NODE_ENV === 'production',
  })

  return app
}
