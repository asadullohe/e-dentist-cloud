// Fastify ilovasini yasaydi. Ishga tushirish index.ts da — shunda testlar
// serverni portga bogʻlamasdan, app.inject() bilan tekshira oladi.

import { randomUUID } from 'node:crypto'
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import { healthRoutes } from '../modules/health/routes.js'
import type { Config } from './config.js'
import { AppXato, xato } from './errors.js'
import { xatoJavobi } from './javob.js'

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

export function yaratServer(config: Config): FastifyInstance {
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

  app.register(healthRoutes, { prefix: '/api' })

  return app
}
