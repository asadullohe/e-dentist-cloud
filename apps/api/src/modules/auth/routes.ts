import type { FastifyPluginAsync } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { SESSION_COOKIE } from '../../platform/session.js'
import { validateInput } from '../../platform/validate.js'
import {
  inviteAcceptSchema,
  inviteSchema,
  loginSchema,
  registerSchema,
  staffUpdateSchema,
  verifySchema,
} from './schema.js'
import * as service from './service.js'

const SESSION_TTL = 60 * 60 * 24 * 7

export interface AuthRouteOpts {
  deps: service.AuthDeps
  /// Prod da cookie faqat HTTPS orqali yuboriladi
  secureCookie: boolean
}

export const authRoutes: FastifyPluginAsync<AuthRouteOpts> = async (app, opts) => {
  app.post('/auth/register', async (req) => {
    const input = validateInput(registerSchema, req.body)
    return ok(await service.register(opts.deps, input, req.ip))
  })

  app.post('/auth/verify', async (req) => {
    const { token } = validateInput(verifySchema, req.body)
    await service.verifyEmail(opts.deps, token)
    return ok({ verified: true })
  })

  app.post('/auth/login', async (req, reply) => {
    const input = validateInput(loginSchema, req.body)
    const sessionId = await service.login(opts.deps, input, req.ip)
    reply.setCookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: opts.secureCookie,
      path: '/',
      maxAge: SESSION_TTL,
    })
    return ok({ loggedIn: true })
  })

  app.post('/auth/logout', async (req, reply) => {
    if (req.sessionId) await service.logout(opts.deps, req.sessionId, req.session)
    reply.clearCookie(SESSION_COOKIE, { path: '/' })
    return ok({ loggedOut: true })
  })

  app.get('/me', async (req) => {
    const session = requireAuth(req)
    return ok(await service.currentUser(opts.deps, session))
  })

  // ─────────────────────────  Taklifnoma (ochiq)  ─────────────────────────
  // Havolani ochgan odam hali kirmagan — bu ikkisi sessiyasiz ishlaydi

  app.get('/invites/:token', async (req) => {
    const { token } = req.params as { token: string }
    return ok(await service.inviteInfo(opts.deps, token))
  })

  app.post('/invites/accept', async (req, reply) => {
    const input = validateInput(inviteAcceptSchema, req.body)
    const sessionId = await service.acceptInvite(opts.deps, input, req.ip)
    reply.setCookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: opts.secureCookie,
      path: '/',
      maxAge: SESSION_TTL,
    })
    return ok({ loggedIn: true })
  })

  // ────────────────────────────  Xodimlar  ────────────────────────────

  const manage = { preHandler: app.requirePermission('staff.manage') }

  function clinicOf(req: Parameters<typeof requireAuth>[0]) {
    const session = requireAuth(req)
    if (!session.clinicId) throw errors.forbidden()
    return { clinicId: session.clinicId, userId: session.userId }
  }

  app.get(
    '/staff/names',
    { preHandler: app.requireAnyPermission('staff.manage', 'lab.write') },
    async (req) => {
      const { clinicId } = clinicOf(req)
      return ok(await service.listStaffNames(opts.deps, clinicId))
    },
  )

  app.get('/staff', manage, async (req) => {
    const { clinicId } = clinicOf(req)
    return ok(await service.listStaff(opts.deps, clinicId))
  })

  app.post('/staff/invite', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(inviteSchema, req.body)
    return ok(await service.invite(opts.deps, clinicId, userId, input))
  })

  app.delete('/staff/invites/:id', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    await service.revokeInvite(opts.deps, clinicId, userId, id)
    return ok({ deleted: true })
  })

  app.patch('/staff/:id', manage, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(staffUpdateSchema, req.body)
    return ok(await service.updateStaff(opts.deps, clinicId, userId, id, input))
  })
}
