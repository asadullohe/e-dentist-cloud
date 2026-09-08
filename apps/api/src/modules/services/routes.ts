import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import { serviceCreateSchema, serviceUpdateSchema } from './schema.js'
import * as service from './service.js'

export interface ServiceRouteOpts {
  deps: service.ServiceDeps
}

function clinicOf(req: FastifyRequest): { clinicId: string; userId: string } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return { clinicId: session.clinicId, userId: session.userId }
}

export const serviceRoutes: FastifyPluginAsync<ServiceRouteOpts> = async (app, opts) => {
  // Narxnomani oʻzgartirish uchun alohida ruxsat, oʻqish uchun esa yoʻq:
  // shifokor tashrif yozayotganda narxni shundan tanlaydi, lekin unga
  // `services.manage` berilmagan (tz.md 6-boʻlim). Bu bemor maʼlumoti emas,
  // klinikaning oʻz sozlamasi
  const manage = { preHandler: app.requirePermission('services.manage') }

  app.get('/services', async (req) => {
    const { clinicId } = clinicOf(req)
    return ok(await service.list(opts.deps, clinicId))
  })

  app.post('/services', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(serviceCreateSchema, req.body)
    return ok(await service.create(opts.deps, clinicId, userId, input))
  })

  app.patch('/services/:id', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(serviceUpdateSchema, req.body)
    return ok(await service.update(opts.deps, clinicId, userId, id, input))
  })

  app.delete('/services/:id', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    await service.remove(opts.deps, clinicId, userId, id)
    return ok({ deleted: true })
  })
}
