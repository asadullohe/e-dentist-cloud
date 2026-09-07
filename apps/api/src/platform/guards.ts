// Sessiya cookie sini oʻqiydi va soʻrovga bogʻlaydi.
// Ruxsat tekshiruvi (requirePermission) — bosqich 1.13.

import type { Permission } from '@e-dentist/shared'
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'
import { errors } from './errors.js'
import { SESSION_COOKIE, type SessionData, type SessionStore } from './session.js'

declare module 'fastify' {
  interface FastifyRequest {
    session: SessionData | null
    sessionId: string | null
    permissions: readonly Permission[]
  }

  interface FastifyInstance {
    /// `preHandler: app.talabRuxsat('patients.read')`
    requirePermission(required: Permission): preHandlerHookHandler
  }
}

export function sessionHook(sessions: SessionStore) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    req.session = null
    req.sessionId = null

    const id = req.cookies[SESSION_COOKIE]
    if (!id) return

    const data = await sessions.read(id)
    if (!data) return

    req.sessionId = id
    req.session = data
  }
}

/// Kirmagan boʻlsa 401
export function requireAuth(req: FastifyRequest): SessionData {
  if (!req.session) throw errors.unauthorized()
  return req.session
}

/// Rolning ruxsatlarini oʻqiydi. clinics moduli beradi — platform modullarni
/// import qilmaydi, shuning uchun funksiya tashqaridan uzatiladi
export type PermissionLoader = (clinicId: string, userId: string) => Promise<readonly Permission[]>

/// Rol ham, ruxsatlar ham har soʻrovda bazadan oʻqiladi.
///
/// Sabab: egasi xodimning rolini almashtirishi yoki rolning ruxsatlarini
/// oʻzgartirishi mumkin, xodimni butunlay faolsizlantirishi ham. Bularning
/// hammasi darhol kuchga kirishi kerak — xodim qayta kirguncha emas
export function permissionGuard(load: PermissionLoader) {
  return (required: Permission): preHandlerHookHandler => {
    return async (req: FastifyRequest) => {
      const session = requireAuth(req)
      if (!session.clinicId) throw errors.forbidden()

      const permissions = await load(session.clinicId, session.userId)
      req.permissions = permissions
      if (!permissions.includes(required)) throw errors.forbidden()
    }
  }
}
