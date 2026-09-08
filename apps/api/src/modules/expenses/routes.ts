import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import { expenseCreateSchema, expenseListSchema, expenseUpdateSchema } from './schema.js'
import * as service from './service.js'

export interface ExpenseRouteOpts {
  deps: service.ExpenseDeps
}

function clinicOf(req: FastifyRequest): { clinicId: string; userId: string } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return { clinicId: session.clinicId, userId: session.userId }
}

export const expenseRoutes: FastifyPluginAsync<ExpenseRouteOpts> = async (app, opts) => {
  // Ruxsatlar roʻyxatida xarajat uchun bitta kalit bor — `expenses.read`
  // (tz.md 6-boʻlim). U boʻlimni butunlay ochadi: xarajatni koʻrgan odam
  // uni yoza ham oladi. Roʻyxat ataylab qisqa, boʻlim esa egasiga tegishli
  const allow = { preHandler: app.requirePermission('expenses.read') }

  app.get('/expenses', allow, async (req) => {
    const { clinicId } = clinicOf(req)
    const input = validateInput(expenseListSchema, req.query)
    return ok(await service.listMonth(opts.deps, clinicId, input))
  })

  app.post('/expenses', allow, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(expenseCreateSchema, req.body)
    return ok(await service.create(opts.deps, clinicId, userId, input))
  })

  app.patch('/expenses/:id', allow, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(expenseUpdateSchema, req.body)
    return ok(await service.update(opts.deps, clinicId, userId, id, input))
  })

  app.delete('/expenses/:id', allow, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    await service.remove(opts.deps, clinicId, userId, id)
    return ok({ deleted: true })
  })
}
