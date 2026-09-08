// Ochiq navbat marshrutlari: sessiya talab qilinmaydi.
//
// Bu tizimning yagona loginsiz yuzasi — shuning uchun har bir javob
// ataylab tor: klinika nomi, shifokorlar va raqamlar. Bemor ismlari
// qaytmaydi (tz.md 14-boʻlim, maxfiylik chegarasi).

import { randomUUID } from 'node:crypto'
import { QUEUE_TEXT } from '@e-dentist/shared'
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import * as queue from './queue.js'
import { queueJoinSchema, queueStatusSchema } from './queueSchema.js'

function clinicOf(req: FastifyRequest): { clinicId: string; userId: string } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return { clinicId: session.clinicId, userId: session.userId }
}

/// Proxy oqimni jim deb uzib yubormasligi uchun
const HEARTBEAT_MS = 25_000

/// Qurilmani belgilaydigan cookie. Login emas — faqat «shu brauzerdan
/// bugun nechta yozuv boʻldi» degan hisob uchun
const DEVICE_COOKIE = 'ed_device'
const DEVICE_TTL = 60 * 60 * 24 * 365

/// Bitta IP dan bir vaqtda nechta oqim ochilishi mumkin. Ochiq marshrut
/// boʻlgani uchun ulanishlarni cheksiz ushlab turishga yoʻl qoʻymaymiz
const STREAM_PER_IP = 3
const streams = new Map<string, number>()

/// Qurilma belgisi: boʻlmasa yaratiladi va cookie ga yoziladi
function deviceId(req: FastifyRequest, reply: FastifyReply, secure: boolean): string {
  const existing = req.cookies[DEVICE_COOKIE]
  if (existing) return existing

  const fresh = randomUUID()
  reply.setCookie(DEVICE_COOKIE, fresh, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: DEVICE_TTL,
  })
  return fresh
}

export interface QueueRouteOpts {
  deps: queue.QueueDeps
  /// Prod da cookie faqat HTTPS orqali yuboriladi
  secureCookie: boolean
}

export const queueRoutes: FastifyPluginAsync<QueueRouteOpts> = async (app, opts) => {
  app.get('/n/:code', async (req) => {
    const { code } = req.params as { code: string }
    return ok(await queue.board(opts.deps, code))
  })

  app.post('/n/:code/join', async (req, reply) => {
    const { code } = req.params as { code: string }
    const input = validateInput(queueJoinSchema, req.body)
    const device = deviceId(req, reply, opts.secureCookie)
    return ok(await queue.join(opts.deps, code, input, { ip: req.ip, deviceId: device }))
  })

  // Kutish xonasi ekrani. Javobda bemor ismlari yoʻq
  app.get('/n/:code/screen', async (req) => {
    const { code } = req.params as { code: string }
    return ok(await queue.screen(opts.deps, code))
  })

  // Jonli yangilanish. SSE tanlangani: maʼlumot bir tomonga oqadi va u
  // oddiy HTTP boʻlgani uchun proxy orqali muammosiz oʻtadi (tz.md 14-boʻlim)
  app.get('/n/:code/stream', async (req, reply) => {
    const { code } = req.params as { code: string }

    // Avval obuna, keyin sarlavhalar: kod notoʻgʻri boʻlsa xato oddiy
    // JSON javob boʻlib chiqsin. Aks holda sarlavhalar allaqachon
    // yozilgan boʻladi va mijoz javobsiz osilib qoladi
    if ((streams.get(req.ip) ?? 0) >= STREAM_PER_IP) {
      throw errors.rateLimited(QUEUE_TEXT.too_many)
    }

    const unsubscribe = await queue.watch(opts.deps, code, () => {
      reply.raw.write('event: update\ndata: 1\n\n')
    })

    // Hisob obunadan keyin oshiriladi: kod notoʻgʻri boʻlsa yuqoridagi
    // qator xato tashlaydi va yopilish hodisasi hech qachon kelmaydi —
    // hisob esa oʻsha IP uchun abadiy band boʻlib qolardi
    streams.set(req.ip, (streams.get(req.ip) ?? 0) + 1)

    // Bundan keyin javobni Fastify emas, oʻzimiz boshqaramiz
    reply.hijack()
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      // nginx va shunga oʻxshash proxy oqimni buferlab qoʻymasin
      'x-accel-buffering': 'no',
    })

    // Bir necha daqiqa jim turgan ulanishni proxy uzib yuboradi —
    // izohli qator uni tirik ushlab turadi
    const heartbeat = setInterval(() => reply.raw.write(': ping\n\n'), HEARTBEAT_MS)

    req.raw.on('close', () => {
      clearInterval(heartbeat)
      unsubscribe()
      const left = (streams.get(req.ip) ?? 1) - 1
      if (left > 0) streams.set(req.ip, left)
      else streams.delete(req.ip)
    })

    reply.raw.write('event: ready\ndata: 1\n\n')
  })

  app.get('/n/:code/ticket/:id', async (req) => {
    const { code, id } = req.params as { code: string; id: string }
    return ok(await queue.ticket(opts.deps, code, id))
  })

  // ─────────────────────  Kabinetdagi navbat  ─────────────────────
  // Bu yerda ismlar koʻrinadi, shuning uchun ruxsat talab qilinadi

  const manage = { preHandler: app.requirePermission('queue.manage') }

  app.get('/queue', manage, async (req) => {
    const { clinicId } = clinicOf(req)
    return ok(await queue.list(opts.deps, clinicId))
  })

  app.patch('/queue/:id', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(queueStatusSchema, req.body)
    return ok(await queue.act(opts.deps, clinicId, userId, id, input))
  })
}
