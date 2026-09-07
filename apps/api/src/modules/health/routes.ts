import { formatDateTime, todayISO } from '@e-dentist/shared'
import type { FastifyPluginAsync } from 'fastify'
import { ok } from '../../platform/response.js'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  // Serverning sanasi ham qaytadi: vaqt zonasi Asia/Tashkent ekanini
  // bir qarashda tekshirib olish uchun
  app.get('/health', async () =>
    ok({
      status: 'ok',
      date: todayISO(),
      time: formatDateTime(new Date()),
    }),
  )
}
