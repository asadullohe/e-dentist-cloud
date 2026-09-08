import type { FastifyPluginAsync } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import { reportSchema } from './schema.js'
import * as service from './service.js'

export interface ReportRouteOpts {
  deps: service.ReportDeps
}

export const reportRoutes: FastifyPluginAsync<ReportRouteOpts> = async (app, opts) => {
  const allow = { preHandler: app.requirePermission('reports.read') }

  app.get('/reports', allow, async (req) => {
    const session = requireAuth(req)
    if (!session.clinicId) throw errors.forbidden()
    const input = validateInput(reportSchema, req.query)
    return ok(await service.monthly(opts.deps, session.clinicId, input))
  })
}
