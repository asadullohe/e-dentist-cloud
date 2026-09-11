import { IMAGE_TEXT } from '@e-dentist/shared'
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

  // Logotip. Sozlama boʻlgani uchun ruxsat ham oʻsha — `staff.manage`
  app.post('/clinic/logo', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const file = await req.file()
    if (!file) throw errors.badRequest(IMAGE_TEXT.no_file)

    return ok(
      await service.uploadLogo(opts.deps, clinicId, userId, {
        buffer: await file.toBuffer(),
        mimetype: file.mimetype,
      }),
    )
  })

  app.delete('/clinic/logo', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    return ok(await service.removeLogo(opts.deps, clinicId, userId))
  })

  // Rasmning oʻzi. Loginsiz ochiladi: u navbat sahifasida ham koʻrsatiladi
  // va maxfiy maʼlumot emas. Manzilda klinika raqami emas, navbat kodi
  app.get('/n/:code/logo', async (req, reply) => {
    const { code } = req.params as { code: string }
    const logo = await service.logoByQueueCode(opts.deps, code)
    if (!logo) throw errors.notFound()

    return (
      reply
        .header('content-type', logo.contentType)
        // Keshlanmaydi: logotip almashganda barcha ekranlarda darrov
        // yangilanishi kerak, fayl esa kichkina
        .header('cache-control', 'no-cache')
        .send(logo.body)
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
