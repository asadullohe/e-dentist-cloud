import type { FastifyPluginAsync } from 'fastify'
import { requirePlatformAdmin } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import * as service from './service.js'

export interface AdminRouteOpts {
  deps: service.AdminDeps
}

export const adminRoutes: FastifyPluginAsync<AdminRouteOpts> = async (app, opts) => {
  app.get('/admin/me', async (req) => {
    const session = requirePlatformAdmin(req)
    return ok(await service.currentAdmin(opts.deps, session.userId))
  })
}
