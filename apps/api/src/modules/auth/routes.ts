import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { SESSION_COOKIE } from '../../platform/session.js'
import { validateInput } from '../../platform/validate.js'
import { loginSchema, registerSchema, verifySchema } from './schema.js'
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
    return ok({ tasdiqlandi: true })
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
    return ok({ kirildi: true })
  })

  app.post('/auth/logout', async (req, reply) => {
    if (req.sessionId) await service.logout(opts.deps, req.sessionId, req.session)
    reply.clearCookie(SESSION_COOKIE, { path: '/' })
    return ok({ chiqildi: true })
  })

  app.get('/me', async (req) => {
    const session = requireAuth(req)
    return ok(await service.currentUser(opts.deps, session))
  })
}
