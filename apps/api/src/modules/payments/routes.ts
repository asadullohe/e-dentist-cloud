import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import { debtorsSchema, paymentCreateSchema, paymentUpdateSchema } from './schema.js'
import * as service from './service.js'

export interface PaymentRouteOpts {
  deps: service.PaymentDeps
}

function clinicOf(req: FastifyRequest): { clinicId: string; userId: string } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return { clinicId: session.clinicId, userId: session.userId }
}

export const paymentRoutes: FastifyPluginAsync<PaymentRouteOpts> = async (app, opts) => {
  const read = { preHandler: app.requirePermission('payments.read') }
  const write = { preHandler: app.requirePermission('payments.write') }

  app.get('/patients/:id/payments', read, async (req) => {
    const { clinicId } = clinicOf(req)
    const { id } = req.params as { id: string }
    return ok(await service.list(opts.deps, clinicId, id))
  })

  app.get('/patients/:id/balance', read, async (req) => {
    const { clinicId } = clinicOf(req)
    const { id } = req.params as { id: string }
    return ok(await service.balance(opts.deps, clinicId, id))
  })

  app.post('/payments', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(paymentCreateSchema, req.body)
    return ok(await service.create(opts.deps, clinicId, userId, input))
  })

  app.patch('/payments/:id', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(paymentUpdateSchema, req.body)
    return ok(await service.update(opts.deps, clinicId, userId, id, input))
  })

  app.delete('/payments/:id', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    await service.remove(opts.deps, clinicId, userId, id)
    return ok({ deleted: true })
  })

  app.get('/debtors', read, async (req) => {
    const { clinicId } = clinicOf(req)
    return ok(await service.debtors(opts.deps, clinicId, validateInput(debtorsSchema, req.query)))
  })
}
