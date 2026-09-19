import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { deviceId } from '../../platform/device.js'
import { errors } from '../../platform/errors.js'
import { requireAuth, viewerOf } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import {
  feedbackListSchema,
  feedbackStatusSchema,
  feedbackSubmitSchema,
  feedbackSummarySchema,
} from './schema.js'
import * as service from './service.js'

export interface FeedbackRouteOpts {
  deps: service.FeedbackDeps
  /// Prod da qurilma cookie si faqat HTTPS orqali
  secureCookie: boolean
}

function clinicOf(req: FastifyRequest): string {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return session.clinicId
}

export const feedbackRoutes: FastifyPluginAsync<FeedbackRouteOpts> = async (app, opts) => {
  // ─────────────  Ochiq sahifa: /f/<kod>  ─────────────
  // Navbat sahifasi kabi loginsiz; javob tor — klinika nomi, shifokorlar

  app.get('/f/:code', async (req) => {
    const { code } = req.params as { code: string }
    return ok(await service.page(opts.deps, code))
  })

  app.post('/f/:code', async (req, reply) => {
    const { code } = req.params as { code: string }
    const input = validateInput(feedbackSubmitSchema, req.body)
    const device = deviceId(req, reply, opts.secureCookie)
    return ok(await service.submit(opts.deps, code, input, { ip: req.ip, deviceId: device }))
  })

  // ─────────────  Kabinet  ─────────────
  // `feedback.read` — hammasi (egasi). `feedback.own` — shifokor oʻzi haqida

  const read = { preHandler: app.requireAnyPermission('feedback.read', 'feedback.own') }

  app.get('/feedback', read, async (req) => {
    const clinicId = clinicOf(req)
    const input = validateInput(feedbackListSchema, req.query)
    return ok(await service.list(opts.deps, clinicId, viewerOf(req, 'feedback.read'), input))
  })

  app.get('/feedback/summary', read, async (req) => {
    const clinicId = clinicOf(req)
    const { month } = validateInput(feedbackSummarySchema, req.query)
    return ok(await service.summary(opts.deps, clinicId, viewerOf(req, 'feedback.read'), month))
  })

  app.patch('/feedback/:id', read, async (req) => {
    const clinicId = clinicOf(req)
    const { id } = req.params as { id: string }
    const { status } = validateInput(feedbackStatusSchema, req.body)
    return ok(
      await service.setStatus(opts.deps, clinicId, viewerOf(req, 'feedback.read'), id, status),
    )
  })
}
