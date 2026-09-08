import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import {
  appointmentCreateSchema,
  appointmentListSchema,
  appointmentUpdateSchema,
} from './schema.js'
import * as service from './service.js'

export interface ScheduleRouteOpts {
  deps: service.ScheduleDeps
}

function clinicOf(req: FastifyRequest): { clinicId: string; userId: string } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return { clinicId: session.clinicId, userId: session.userId }
}

export const scheduleRoutes: FastifyPluginAsync<ScheduleRouteOpts> = async (app, opts) => {
  // Jadvalda bemor ismlari koʻrinadi, shuning uchun oʻqish ham
  // `patients.read` talab qiladi — texnik uni koʻrmaydi (tz.md 7-boʻlim)
  const read = { preHandler: app.requirePermission('patients.read') }
  const write = { preHandler: app.requirePermission('schedule.write') }

  app.get('/appointments', read, async (req) => {
    const { clinicId } = clinicOf(req)
    const input = validateInput(appointmentListSchema, req.query)
    return ok(await service.list(opts.deps, clinicId, input))
  })

  app.post('/appointments', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(appointmentCreateSchema, req.body)
    return ok(await service.create(opts.deps, clinicId, userId, input))
  })

  app.patch('/appointments/:id', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(appointmentUpdateSchema, req.body)
    return ok(await service.update(opts.deps, clinicId, userId, id, input))
  })

  app.delete('/appointments/:id', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    await service.remove(opts.deps, clinicId, userId, id)
    return ok({ deleted: true })
  })
}
