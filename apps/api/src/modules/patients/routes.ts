import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import { patientCreateSchema, patientListSchema, patientUpdateSchema } from './schema.js'
import * as service from './service.js'

export interface PatientRouteOpts {
  deps: service.PatientDeps
}

/// Sessiyada klinika boʻlishi shart. Platforma admini bemor maʼlumotini
/// koʻrmaydi — uning uchun bu modul umuman ochilmaydi (tz.md 11-boʻlim)
function clinicOf(req: FastifyRequest): { clinicId: string; userId: string } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return { clinicId: session.clinicId, userId: session.userId }
}

export const patientRoutes: FastifyPluginAsync<PatientRouteOpts> = async (app, opts) => {
  const read = { preHandler: app.requirePermission('patients.read') }
  const write = { preHandler: app.requirePermission('patients.write') }

  app.get('/patients', read, async (req) => {
    const { clinicId } = clinicOf(req)
    return ok(await service.list(opts.deps, clinicId, validateInput(patientListSchema, req.query)))
  })

  app.get('/patients/:id', read, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    return ok(await service.get(opts.deps, clinicId, userId, id))
  })

  app.post('/patients', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(patientCreateSchema, req.body)
    return ok(await service.create(opts.deps, clinicId, userId, input))
  })

  app.patch('/patients/:id', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(patientUpdateSchema, req.body)
    return ok(await service.update(opts.deps, clinicId, userId, id, input))
  })

  app.delete('/patients/:id', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    await service.remove(opts.deps, clinicId, userId, id)
    return ok({ deleted: true })
  })
}
