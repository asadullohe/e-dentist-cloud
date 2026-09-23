import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { deviceId } from '../../platform/device.js'
import { errors } from '../../platform/errors.js'
import { requireAuth, viewerOf } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import {
  planContentSchema,
  planCreateSchema,
  planItemCompleteSchema,
  planItemSkipSchema,
  planListSchema,
  planRespondSchema,
  planStatusSchema,
  planUpdateSchema,
} from './schema.js'
import * as service from './service.js'

export interface PlanRouteOpts {
  deps: service.PlanDeps
  /// Prod da qurilma cookie si faqat HTTPS orqali
  secureCookie: boolean
}

function contextOf(req: FastifyRequest) {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  // Koʻrinish bemorga bogʻlangan: shifokor (patients.all yoʻq) faqat oʻz
  // bemorlarining rejalarini koʻradi (11.3)
  return { clinicId: session.clinicId, viewer: viewerOf(req, 'patients.all') }
}

export const planRoutes: FastifyPluginAsync<PlanRouteOpts> = async (app, opts) => {
  // ─────────────  Ochiq sahifa: /r/<kod>  ─────────────
  // Navbat va fikr sahifalari kabi loginsiz; javob tor — bemorning toʻliq
  // ismi va telefoni chiqmaydi

  app.get('/r/:code', async (req) => {
    const { code } = req.params as { code: string }
    return ok(await service.publicPage(opts.deps, code))
  })

  app.post('/r/:code', async (req, reply) => {
    const { code } = req.params as { code: string }
    const input = validateInput(planRespondSchema, req.body)
    const device = deviceId(req, reply, opts.secureCookie)
    return ok(await service.respond(opts.deps, code, input, { ip: req.ip, deviceId: device }))
  })

  // Logotipning oʻzi — navbat sahifasidagi `/n/<kod>/logo` bilan bir xil
  app.get('/r/:code/logo', async (req, reply) => {
    const { code } = req.params as { code: string }
    const logo = await service.publicLogo(opts.deps, code)
    if (!logo) throw errors.notFound()
    return reply
      .header('content-type', logo.contentType)
      .header('cache-control', 'no-cache')
      .send(logo.body)
  })

  // ─────────────  Kabinet  ─────────────

  const read = { preHandler: app.requireAnyPermission('plans.read', 'plans.write') }
  const write = { preHandler: app.requirePermission('plans.write') }

  app.get('/plans', read, async (req) => {
    const { clinicId, viewer } = contextOf(req)
    const input = validateInput(planListSchema, req.query)
    return ok(await service.list(opts.deps, clinicId, viewer, input))
  })

  app.get('/plans/:id', read, async (req) => {
    const { clinicId, viewer } = contextOf(req)
    const { id } = req.params as { id: string }
    return ok(await service.get(opts.deps, clinicId, viewer, id))
  })

  app.post('/plans', write, async (req) => {
    const { clinicId, viewer } = contextOf(req)
    const input = validateInput(planCreateSchema, req.body)
    return ok(await service.create(opts.deps, clinicId, viewer, input))
  })

  app.patch('/plans/:id', write, async (req) => {
    const { clinicId, viewer } = contextOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(planUpdateSchema, req.body)
    return ok(await service.update(opts.deps, clinicId, viewer, id, input))
  })

  // Bosqichlar va bandlar birgalikda saqlanadi — brauzer nimani
  // koʻrsatayotgan boʻlsa, oʻshani yuboradi (tortib tartiblash uchun)
  app.put('/plans/:id/content', write, async (req) => {
    const { clinicId, viewer } = contextOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(planContentSchema, req.body)
    return ok(await service.saveContent(opts.deps, clinicId, viewer, id, input))
  })

  app.post('/plans/:id/status', write, async (req) => {
    const { clinicId, viewer } = contextOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(planStatusSchema, req.body)
    return ok(await service.setStatus(opts.deps, clinicId, viewer, id, input))
  })

  // Bandni bajarish — tashrif yozish bilan (11.5 dagi naryad topshirish
  // kabi). Shuning uchun `visits.write` ham talab qilinadi
  const complete = { preHandler: app.requirePermission('visits.write') }

  app.post('/plans/:id/items/:itemId/complete', complete, async (req) => {
    const { clinicId, viewer } = contextOf(req)
    const { id, itemId } = req.params as { id: string; itemId: string }
    const input = validateInput(planItemCompleteSchema, req.body)
    return ok(await service.completeItem(opts.deps, clinicId, viewer, id, itemId, input))
  })

  app.post('/plans/:id/items/:itemId/skip', write, async (req) => {
    const { clinicId, viewer } = contextOf(req)
    const { id, itemId } = req.params as { id: string; itemId: string }
    const { skip } = validateInput(planItemSkipSchema, req.body)
    return ok(await service.skipItem(opts.deps, clinicId, viewer, id, itemId, skip))
  })
}
