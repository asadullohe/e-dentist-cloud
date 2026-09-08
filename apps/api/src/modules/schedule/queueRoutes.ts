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

  app.get('/n/:code/ticket/:id', async (req) => {
    const { code, id } = req.params as { code: string; id: string }
    return ok(await queue.ticket(opts.deps, code, id))
  })
}
