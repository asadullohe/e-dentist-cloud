import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import {
  appointmentCompleteSchema,
  appointmentCreateSchema,
  appointmentListSchema,
  appointmentUpdateSchema,
} from './schema.js'
import * as service from './service.js'

export interface ScheduleRouteOpts {
  deps: service.ScheduleDeps
}

/// `schedule.all` boʻlmasa (shifokor) jadval faqat oʻz qabullari (10.7)
function clinicOf(req: FastifyRequest): { clinicId: string; viewer: service.ScheduleViewer } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return {
    clinicId: session.clinicId,
    viewer: {
      userId: session.userId,
      all: req.permissions.includes('schedule.all'),
      patientsAll: req.permissions.includes('patients.all'),
    },
  }
}

export const scheduleRoutes: FastifyPluginAsync<ScheduleRouteOpts> = async (app, opts) => {
  // Jadvalda bemor ismlari koʻrinadi, shuning uchun oʻqish ham
  // `patients.read` talab qiladi — texnik uni koʻrmaydi (tz.md 7-boʻlim)
  const read = { preHandler: app.requirePermission('patients.read') }
  const write = { preHandler: app.requirePermission('schedule.write') }

  app.get('/appointments', read, async (req) => {
    const { clinicId, viewer } = clinicOf(req)
    const input = validateInput(appointmentListSchema, req.query)
    return ok(await service.list(opts.deps, clinicId, viewer, input))
  })

  app.post('/appointments', write, async (req) => {
    const { clinicId, viewer } = clinicOf(req)
    const input = validateInput(appointmentCreateSchema, req.body)
    return ok(await service.create(opts.deps, clinicId, viewer, input))
  })

  // Yakunlash = tashrif + holat (10.6). Ilgari kim «Yakunlandi» qoʻya olgan
  // boʻlsa — jadval yurituvchi yoki navbat boshqaruvchi — hozir ham shu,
  // faqat qilingan ish bilan. Tashrif qabulning shifokoriga yoziladi
  const complete = { preHandler: app.requireAnyPermission('schedule.write', 'queue.manage') }
  app.post('/appointments/:id/complete', complete, async (req) => {
    const { clinicId, viewer } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(appointmentCompleteSchema, req.body)
    return ok(await service.complete(opts.deps, clinicId, viewer, id, input))
  })

  app.patch('/appointments/:id', write, async (req) => {
    const { clinicId, viewer } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(appointmentUpdateSchema, req.body)
    return ok(await service.update(opts.deps, clinicId, viewer, id, input))
  })

  app.delete('/appointments/:id', write, async (req) => {
    const { clinicId, viewer } = clinicOf(req)
    const { id } = req.params as { id: string }
    await service.remove(opts.deps, clinicId, viewer, id)
    return ok({ deleted: true })
  })
}
