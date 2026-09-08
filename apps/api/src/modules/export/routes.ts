import type { FastifyPluginAsync } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import * as service from './service.js'

export interface ExportRouteOpts {
  deps: service.ExportDeps
}

export const exportRoutes: FastifyPluginAsync<ExportRouteOpts> = async (app, opts) => {
  const allow = { preHandler: app.requirePermission('data.export') }

  app.get('/export', allow, async (req, reply) => {
    const session = requireAuth(req)
    if (!session.clinicId) throw errors.forbidden()

    const archive = await service.buildArchive(opts.deps, session.clinicId, session.userId)
    return reply
      .header('content-type', 'application/zip')
      .header('content-disposition', `attachment; filename="${archive.fileName}"`)
      .send(archive.buffer)
  })
}
