import type { FastifyPluginAsync } from 'fastify'
import { requirePlatformAdmin } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import {
  clinicCreateSchema,
  clinicListSchema,
  eventsSchema,
  extendSchema,
  statusSchema,
} from './schema.js'
import * as service from './service.js'

export interface AdminRouteOpts {
  deps: service.AdminDeps
}

export const adminRoutes: FastifyPluginAsync<AdminRouteOpts> = async (app, opts) => {
  app.get('/admin/me', async (req) => {
    const session = requirePlatformAdmin(req)
    return ok(await service.currentAdmin(opts.deps, session.userId))
  })

  app.get('/admin/stats', async (req) => {
    requirePlatformAdmin(req)
    return ok(await service.stats(opts.deps))
  })

  app.get('/admin/events', async (req) => {
    requirePlatformAdmin(req)
    const input = validateInput(eventsSchema, req.query)
    return ok(await service.events(opts.deps, input))
  })

  app.get('/admin/clinics', async (req) => {
    requirePlatformAdmin(req)
    const input = validateInput(clinicListSchema, req.query)
    return ok(await service.listClinics(opts.deps, input))
  })

  // Panelidan klinika ochish: parol soʻralmaydi, egasiga havola ketadi
  app.post('/admin/clinics', async (req) => {
    const session = requirePlatformAdmin(req)
    const input = validateInput(clinicCreateSchema, req.body)
    return ok(await service.createClinic(opts.deps, session.userId, input))
  })

  // Xat yoʻqolsa yoki muddati oʻtsa — yangi havola
  app.post('/admin/clinics/:id/invite', async (req) => {
    const session = requirePlatformAdmin(req)
    const { id } = req.params as { id: string }
    return ok(await service.resendInvite(opts.deps, session.userId, id))
  })

  app.get('/admin/clinics/:id', async (req) => {
    requirePlatformAdmin(req)
    const { id } = req.params as { id: string }
    return ok(await service.clinicCard(opts.deps, id))
  })

  app.post('/admin/clinics/:id/extend', async (req) => {
    const session = requirePlatformAdmin(req)
    const { id } = req.params as { id: string }
    const input = validateInput(extendSchema, req.body)
    return ok(await service.extendClinic(opts.deps, session.userId, id, input))
  })

  app.post('/admin/clinics/:id/status', async (req) => {
    const session = requirePlatformAdmin(req)
    const { id } = req.params as { id: string }
    const input = validateInput(statusSchema, req.body)
    return ok(await service.setClinicStatus(opts.deps, session.userId, id, input))
  })
}
