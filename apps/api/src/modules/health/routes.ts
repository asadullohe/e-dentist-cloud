import { fmtDateTime, todayStr } from '@e-dentist/shared'
import type { FastifyPluginAsync } from 'fastify'
import { ok } from '../../platform/javob.js'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  // Serverning sanasi ham qaytadi: vaqt zonasi Asia/Tashkent ekanini
  // bir qarashda tekshirib olish uchun
  app.get('/health', async () =>
    ok({
      status: 'ok',
      sana: todayStr(),
      vaqt: fmtDateTime(new Date()),
    }),
  )
}
