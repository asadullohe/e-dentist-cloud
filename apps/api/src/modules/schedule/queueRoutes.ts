// Ochiq navbat marshrutlari: sessiya talab qilinmaydi.
//
// Bu tizimning yagona loginsiz yuzasi — shuning uchun har bir javob
// ataylab tor: klinika nomi, shifokorlar va raqamlar. Bemor ismlari
// qaytmaydi (tz.md 14-boʻlim, maxfiylik chegarasi).

import type { FastifyPluginAsync } from 'fastify'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import * as queue from './queue.js'
import { queueJoinSchema } from './queueSchema.js'

/// Proxy oqimni jim deb uzib yubormasligi uchun
const HEARTBEAT_MS = 25_000

export interface QueueRouteOpts {
  deps: queue.QueueDeps
}

export const queueRoutes: FastifyPluginAsync<QueueRouteOpts> = async (app, opts) => {
  app.get('/n/:code', async (req) => {
    const { code } = req.params as { code: string }
    return ok(await queue.board(opts.deps, code))
  })

  app.post('/n/:code/join', async (req) => {
    const { code } = req.params as { code: string }
    const input = validateInput(queueJoinSchema, req.body)
    return ok(await queue.join(opts.deps, code, input, req.ip))
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
    const unsubscribe = await queue.watch(opts.deps, code, () => {
      reply.raw.write('event: update\ndata: 1\n\n')
    })

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
    })

    reply.raw.write('event: ready\ndata: 1\n\n')
  })

  app.get('/n/:code/ticket/:id', async (req) => {
    const { code, id } = req.params as { code: string; id: string }
    return ok(await queue.ticket(opts.deps, code, id))
  })
}
