import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import { payrollSchema, payrollVisitsSchema, recalculateSchema } from './schema.js'
import * as service from './service.js'

export interface PayrollRouteOpts {
  deps: service.PayrollDeps
}

/// `payroll.manage` — hamma xodim; `payroll.own` — faqat oʻzi.
/// Qaysi biri borligini guard `req.permissions` ga yozib qoʻyadi
function viewerOf(req: FastifyRequest): { clinicId: string; viewer: service.Viewer } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return {
    clinicId: session.clinicId,
    viewer: { userId: session.userId, manage: req.permissions.includes('payroll.manage') },
  }
}

export const payrollRoutes: FastifyPluginAsync<PayrollRouteOpts> = async (app, opts) => {
  const view = { preHandler: app.requireAnyPermission('payroll.manage', 'payroll.own') }
  const manage = { preHandler: app.requirePermission('payroll.manage') }

  app.get('/payroll', view, async (req) => {
    const { clinicId, viewer } = viewerOf(req)
    const input = validateInput(payrollSchema, req.query)
    return ok(await service.monthly(opts.deps, clinicId, viewer, input))
  })

  app.get('/payroll/visits', view, async (req) => {
    const { clinicId, viewer } = viewerOf(req)
    const input = validateInput(payrollVisitsSchema, req.query)
    return ok(await service.visitsOf(opts.deps, clinicId, viewer, input))
  })

  app.post('/payroll/recalculate', manage, async (req) => {
    const { clinicId, viewer } = viewerOf(req)
    const input = validateInput(recalculateSchema, req.body)
    return ok(await service.recalculate(opts.deps, clinicId, viewer.userId, input))
  })
}
