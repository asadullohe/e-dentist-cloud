import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth, viewerOf } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import {
  planContentSchema,
  planCreateSchema,
  planListSchema,
  planStatusSchema,
  planUpdateSchema,
} from './schema.js'
import * as service from './service.js'

export interface PlanRouteOpts {
  deps: service.PlanDeps
}

function contextOf(req: FastifyRequest) {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  // Koʻrinish bemorga bogʻlangan: shifokor (patients.all yoʻq) faqat oʻz
  // bemorlarining rejalarini koʻradi (11.3)
  return { clinicId: session.clinicId, viewer: viewerOf(req, 'patients.all') }
}

export const planRoutes: FastifyPluginAsync<PlanRouteOpts> = async (app, opts) => {
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
}
