import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth, viewerOf } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import {
  allocationsSchema,
  debtorsSchema,
  paymentCancelSchema,
  paymentCreateSchema,
  paymentUpdateSchema,
} from './schema.js'
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

  // Kim koʻrayapti: `patients.all` boʻlmasa (shifokor) faqat oʻz bemorlari
  const viewer = (req: FastifyRequest) => viewerOf(req, 'patients.all')

  app.get('/patients/:id/payments', read, async (req) => {
    const { clinicId } = clinicOf(req)
    const { id } = req.params as { id: string }
    return ok(await service.list(opts.deps, clinicId, viewer(req), id))
  })

  app.get('/patients/:id/balance', read, async (req) => {
    const { clinicId } = clinicOf(req)
    const { id } = req.params as { id: string }
    return ok(await service.balance(opts.deps, clinicId, viewer(req), id))
  })

  app.post('/payments', write, async (req) => {
    const { clinicId } = clinicOf(req)
    const input = validateInput(paymentCreateSchema, req.body)
    return ok(await service.create(opts.deps, clinicId, viewer(req), input))
  })

  app.patch('/payments/:id', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(paymentUpdateSchema, req.body)
    return ok(await service.update(opts.deps, clinicId, userId, id, input))
  })

  // Qaysi ishga — keyin oʻrnatish yoki tuzatish
  app.put('/payments/:id/allocations', write, async (req) => {
    const { clinicId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(allocationsSchema, req.body)
    return ok(await service.setAllocations(opts.deps, clinicId, viewer(req), id, input))
  })

  // Oʻchirish yoʻq — bekor qilish, sabab bilan (qaror 19/09/2026)
  app.post('/payments/:id/cancel', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(paymentCancelSchema, req.body)
    return ok(await service.cancel(opts.deps, clinicId, userId, id, input))
  })

  app.get('/debtors', read, async (req) => {
    const { clinicId } = clinicOf(req)
    const input = validateInput(debtorsSchema, req.query)
    return ok(await service.debtors(opts.deps, clinicId, viewer(req), input))
  })
}
