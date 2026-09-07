// Sessiya cookie sini oʻqiydi va soʻrovga bogʻlaydi.
// Ruxsat tekshiruvi (requirePermission) — bosqich 1.13.

import type { Ruxsat } from '@e-dentist/shared'
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'
import { xato } from './errors.js'
import { COOKIE_NOMI, type SessiyaMazmuni, type SessiyaSaqlagich } from './sessiya.js'

declare module 'fastify' {
  interface FastifyRequest {
    sessiya: SessiyaMazmuni | null
    sessiyaId: string | null
    ruxsatlar: readonly Ruxsat[]
  }

  interface FastifyInstance {
    /// `preHandler: app.talabRuxsat('patients.read')`
    talabRuxsat(kerak: Ruxsat): preHandlerHookHandler
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

/// Kirmagan boʻlsa 401
export function talabKirish(req: FastifyRequest): SessiyaMazmuni {
  if (!req.sessiya) throw xato.unauthorized()
  return req.sessiya
}

/// Rolning ruxsatlarini oʻqiydi. clinics moduli beradi — platform modullarni
/// import qilmaydi, shuning uchun funksiya tashqaridan uzatiladi
export type RuxsatYuklovchi = (clinicId: string, userId: string) => Promise<readonly Ruxsat[]>

/// Rol ham, ruxsatlar ham har soʻrovda bazadan oʻqiladi.
///
/// Sabab: egasi xodimning rolini almashtirishi yoki rolning ruxsatlarini
/// oʻzgartirishi mumkin, xodimni butunlay faolsizlantirishi ham. Bularning
/// hammasi darhol kuchga kirishi kerak — xodim qayta kirguncha emas
export function ruxsatTekshiruvi(yukla: RuxsatYuklovchi) {
  return (kerak: Ruxsat): preHandlerHookHandler => {
    return async (req: FastifyRequest) => {
      const sessiya = talabKirish(req)
      if (!sessiya.clinicId) throw xato.forbidden()

      const ruxsatlar = await yukla(sessiya.clinicId, sessiya.userId)
      req.ruxsatlar = ruxsatlar
      if (!ruxsatlar.includes(kerak)) throw xato.forbidden()
    }
  }
}
