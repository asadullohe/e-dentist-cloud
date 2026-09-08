import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import { queueSettingsSchema, rolePermissionsSchema } from './schema.js'
import * as service from './service.js'

export interface ClinicRouteOpts {
  deps: service.ClinicDeps
}

function clinicOf(req: FastifyRequest): { clinicId: string; userId: string } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return { clinicId: session.clinicId, userId: session.userId }
}

export const clinicRoutes: FastifyPluginAsync<ClinicRouteOpts> = async (app, opts) => {
  // Rollar xodimlar bilan bitta ekranda — ruxsat ham bitta
  const manage = { preHandler: app.requirePermission('staff.manage') }

  app.get('/roles', manage, async (req) => {
    const { clinicId } = clinicOf(req)
    return ok(await service.listRoles(opts.deps, clinicId))
  })

  app.patch('/roles/:id', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(rolePermissionsSchema, req.body)
    return ok(
      await service.updateRolePermissions(opts.deps, clinicId, userId, id, [...input.permissions]),
    )
  })

  // Navbatni butunlay yopish — klinikaning oʻz qarori (tz.md 14-boʻlim).
  // Bu sozlama, shuning uchun `queue.manage` emas, `staff.manage`
  app.patch('/clinic/queue', manage, async (req) => {
    const { clinicId } = clinicOf(req)
    const input = validateInput(queueSettingsSchema, req.body)
    const clinic = await service.setQueueEnabled(opts.deps, clinicId, input.enabled)
    return ok({ queueEnabled: clinic.queueEnabled, queueCode: clinic.queueCode })
  })
}
