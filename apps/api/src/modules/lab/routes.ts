import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import {
  labCreateSchema,
  labListSchema,
  labReturnSchema,
  labStatusSchema,
  labUpdateSchema,
} from './schema.js'
import * as service from './service.js'

export interface LabRouteOpts {
  deps: service.LabDeps
}

function actorOf(req: FastifyRequest) {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return { clinicId: session.clinicId, userId: session.userId, permissions: req.permissions ?? [] }
}

export const labRoutes: FastifyPluginAsync<LabRouteOpts> = async (app, opts) => {
  // Texnik `lab.own` bilan kiradi va faqat oʻz naryadlarini koʻradi —
  // filtrni xizmat qatlami majburlaydi
  const read = { preHandler: app.requireAnyPermission('lab.own', 'lab.write') }
  const write = { preHandler: app.requirePermission('lab.write') }

  app.get('/lab-orders', read, async (req) => {
    const { clinicId, userId, permissions } = actorOf(req)
    const input = validateInput(labListSchema, req.query)
    return ok(await service.list(opts.deps, clinicId, userId, permissions, input))
  })

  app.post('/lab-orders', write, async (req) => {
    const { clinicId, userId, permissions } = actorOf(req)
    const input = validateInput(labCreateSchema, req.body)
    return ok(await service.create(opts.deps, clinicId, userId, permissions, input))
  })

  app.patch('/lab-orders/:id', write, async (req) => {
    const { clinicId, userId, permissions } = actorOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(labUpdateSchema, req.body)
    return ok(await service.update(opts.deps, clinicId, userId, permissions, id, input))
  })

  app.patch('/lab-orders/:id/status', read, async (req) => {
    const { clinicId, userId, permissions } = actorOf(req)
    const { id } = req.params as { id: string }
    const { status } = validateInput(labStatusSchema, req.body)
    return ok(await service.setStatus(opts.deps, clinicId, userId, permissions, id, status))
  })

  app.post('/lab-orders/:id/return', write, async (req) => {
    const { clinicId, userId, permissions } = actorOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(labReturnSchema, req.body)
    return ok(await service.markReturned(opts.deps, clinicId, userId, permissions, id, input))
  })

  app.delete('/lab-orders/:id', write, async (req) => {
    const { clinicId, userId } = actorOf(req)
    const { id } = req.params as { id: string }
    await service.remove(opts.deps, clinicId, userId, id)
    return ok({ deleted: true })
  })
}
