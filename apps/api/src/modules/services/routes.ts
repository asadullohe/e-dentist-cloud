import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import {
  orderSchema,
  serviceCreateSchema,
  serviceTypeSchema,
  serviceUpdateSchema,
} from './schema.js'
import * as service from './service.js'

export interface ServiceRouteOpts {
  deps: service.ServiceDeps
}

function clinicOf(req: FastifyRequest): { clinicId: string; userId: string } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return { clinicId: session.clinicId, userId: session.userId }
}

const idOf = (req: FastifyRequest) => (req.params as { id: string }).id

export const serviceRoutes: FastifyPluginAsync<ServiceRouteOpts> = async (app, opts) => {
  // Katalogni oʻzgartirish uchun alohida ruxsat, oʻqish uchun esa yoʻq:
  // shifokor tashrif yozayotganda narxni shundan tanlaydi, lekin unga
  // `services.manage` berilmagan (tz.md 6-boʻlim). Bu bemor maʼlumoti emas,
  // klinikaning oʻz sozlamasi
  const manage = { preHandler: app.requirePermission('services.manage') }

  // ── Turlar ──

  app.get('/service-types', async (req) => {
    const { clinicId } = clinicOf(req)
    return ok(await service.listTypes(opts.deps, clinicId))
  })

  app.post('/service-types', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(serviceTypeSchema, req.body)
    return ok(await service.createType(opts.deps, clinicId, userId, input))
  })

  // Tartib marshruti `:id` dan oldin — aks holda «order» id deb oʻqiladi
  app.patch('/service-types/order', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(orderSchema, req.body)
    await service.reorderTypes(opts.deps, clinicId, userId, input)
    return ok({ reordered: true })
  })

  app.patch('/service-types/:id', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(serviceTypeSchema, req.body)
    return ok(await service.updateType(opts.deps, clinicId, userId, idOf(req), input))
  })

  app.delete('/service-types/:id', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    await service.removeType(opts.deps, clinicId, userId, idOf(req))
    return ok({ deleted: true })
  })

  app.patch('/service-types/:id/order', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(orderSchema, req.body)
    await service.reorderServices(opts.deps, clinicId, userId, idOf(req), input)
    return ok({ reordered: true })
  })

  // ── Xizmatlar ──

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
    const input = validateInput(serviceUpdateSchema, req.body)
    return ok(await service.update(opts.deps, clinicId, userId, idOf(req), input))
  })

  app.delete('/services/:id', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    await service.remove(opts.deps, clinicId, userId, idOf(req))
    return ok({ deleted: true })
  })
}
