// Sessiya cookie sini oʻqiydi va soʻrovga bogʻlaydi.
// Ruxsat tekshiruvi (requirePermission) — bosqich 1.13.

import type { FastifyReply, FastifyRequest } from 'fastify'
import { xato } from './errors.js'
import { COOKIE_NOMI, type SessiyaMazmuni, type SessiyaSaqlagich } from './sessiya.js'

declare module 'fastify' {
  interface FastifyRequest {
    sessiya: SessiyaMazmuni | null
    sessiyaId: string | null
  }
}

export function sessiyaHooki(sessiyalar: SessiyaSaqlagich) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    req.sessiya = null
    req.sessiyaId = null

    const id = req.cookies[COOKIE_NOMI]
    if (!id) return

    const mazmun = await sessiyalar.oqi(id)
    if (!mazmun) return

    req.sessiyaId = id
    req.sessiya = mazmun
  }
}

/// Kirmagan boʻlsa 401. Ruxsat tekshiruvi bundan keyin keladi
export function talabKirish(req: FastifyRequest): SessiyaMazmuni {
  if (!req.sessiya) throw xato.unauthorized()
  return req.sessiya
}
