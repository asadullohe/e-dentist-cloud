import type { FastifyPluginAsync } from 'fastify'
import { ok } from '../../platform/javob.js'
import { talabKirish } from '../../platform/kirish.js'
import { COOKIE_NOMI } from '../../platform/sessiya.js'
import { tekshir } from '../../platform/tekshir.js'
import { KirishSxemasi, RoyxatSxemasi, TasdiqlashSxemasi } from './schema.js'
import * as service from './service.js'

const OMR_SONIYA = 60 * 60 * 24 * 7

export interface AuthRouteOpts {
  deps: service.AuthDeps
  /// Prod da cookie faqat HTTPS orqali yuboriladi
  xavfsizCookie: boolean
}

export const authRoutes: FastifyPluginAsync<AuthRouteOpts> = async (app, opts) => {
  app.post('/auth/register', async (req) => {
    const kirish = tekshir(RoyxatSxemasi, req.body)
    return ok(await service.royxatdanOt(opts.deps, kirish, req.ip))
  })

  app.post('/auth/verify', async (req) => {
    const { token } = tekshir(TasdiqlashSxemasi, req.body)
    await service.tasdiqla(opts.deps, token)
    return ok({ tasdiqlandi: true })
  })

  app.post('/auth/login', async (req, reply) => {
    const kirish = tekshir(KirishSxemasi, req.body)
    const sessiyaId = await service.kir(opts.deps, kirish, req.ip)
    reply.setCookie(COOKIE_NOMI, sessiyaId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: opts.xavfsizCookie,
      path: '/',
      maxAge: OMR_SONIYA,
    })
    return ok({ kirildi: true })
  })

  app.post('/auth/logout', async (req, reply) => {
    if (req.sessiyaId) await service.chiq(opts.deps, req.sessiyaId, req.sessiya)
    reply.clearCookie(COOKIE_NOMI, { path: '/' })
    return ok({ chiqildi: true })
  })

  app.get('/me', async (req) => {
    const sessiya = talabKirish(req)
    return ok(await service.men(opts.deps, sessiya))
  })
}
