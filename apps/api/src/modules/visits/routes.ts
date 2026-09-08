import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import { toothUpdateSchema, visitCreateSchema, visitUpdateSchema } from './schema.js'
import * as service from './service.js'

export interface VisitRouteOpts {
  deps: service.VisitDeps
}

function clinicOf(req: FastifyRequest): { clinicId: string; userId: string } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return { clinicId: session.clinicId, userId: session.userId }
}

export const visitRoutes: FastifyPluginAsync<VisitRouteOpts> = async (app, opts) => {
  // Oʻqish bemor kartochkasining bir qismi — patients.read yetarli.
  // Yozish uchun alohida ruxsatlar: tashrif va tish xaritasi turli rollarga
  // ochilishi mumkin (tz.md 6-boʻlim)
  const read = { preHandler: app.requirePermission('patients.read') }
  const writeVisit = { preHandler: app.requirePermission('visits.write') }
  const writeTeeth = { preHandler: app.requirePermission('teeth.write') }

  app.get('/patients/:id/visits', read, async (req) => {
    const { clinicId } = clinicOf(req)
    const { id } = req.params as { id: string }
    return ok(await service.listVisits(opts.deps, clinicId, id))
  })

  app.post('/visits', writeVisit, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(visitCreateSchema, req.body)
    return ok(await service.createVisit(opts.deps, clinicId, userId, input))
  })

  app.patch('/visits/:id', writeVisit, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(visitUpdateSchema, req.body)
    return ok(await service.updateVisit(opts.deps, clinicId, userId, id, input))
  })

  app.delete('/visits/:id', writeVisit, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    await service.removeVisit(opts.deps, clinicId, userId, id)
    return ok({ deleted: true })
  })

  app.get('/patients/:id/teeth', read, async (req) => {
    const { clinicId } = clinicOf(req)
    const { id } = req.params as { id: string }
    return ok(await service.chart(opts.deps, clinicId, id))
  })

  app.put('/patients/:id/teeth/:tooth', writeTeeth, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id, tooth } = req.params as { id: string; tooth: string }
    const input = validateInput(toothUpdateSchema, req.body)
    return ok(await service.setTooth(opts.deps, clinicId, userId, id, Number(tooth), input))
  })
}
