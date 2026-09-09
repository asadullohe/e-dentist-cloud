// 1.4 ning asosiy talabi: javob shakli hamma yerda bir xil boʻlishi va
// texnik tafsilot foydalanuvchiga hech qachon chiqmasligi.

import { describe, expect, it } from 'vitest'
import { memoryBus } from './platform/bus.js'
import type { Db } from './platform/db.js'
import { errors } from './platform/errors.js'
import { memoryMailer } from './platform/mailer.js'
import { silentNotifier } from './platform/notify.js'
import { createServer, type ServerDeps } from './platform/server.js'
import type { SessionStore } from './platform/session.js'
import { fakeImports, fakeStorage, testConfig } from './test-support/config.js'

// Bu fayl faqat javob shaklini tekshiradi — bazaga ham, Redis ga ham
// murojaat qilmaydi
const fakeDeps: ServerDeps = {
  db: {} as Db,
  sessions: {
    ping: async () => {},
    create: async () => 'sinov',
    read: async () => null,
    destroy: async () => {},
    close: async () => {},
  } satisfies SessionStore,
  rateLimiter: {
    hit: async () => ({ allowed: true, resetInSeconds: 0 }),
    reset: async () => {},
    close: async () => {},
  },
  storage: fakeStorage,
  imports: fakeImports,
  mailer: memoryMailer(),
  bus: memoryBus(),
  notify: silentNotifier(),
}

const config = testConfig()

describe('GET /api/health', () => {
  it('ok shaklida javob beradi', async () => {
    const app = createServer(config, fakeDeps)
    const r = await app.inject({ method: 'GET', url: '/api/health' })
    expect(r.statusCode).toBe(200)
    expect(r.json()).toMatchObject({ ok: true, data: { status: 'ok' } })
    await app.close()
  })

  it('sanani KK/OO/YYYY emas, YYYY-MM-DD da qaytaradi (API shakli)', async () => {
    const app = createServer(config, fakeDeps)
    const r = await app.inject({ method: 'GET', url: '/api/health' })
    expect(r.json().data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    await app.close()
  })
})

describe('xato javoblari', () => {
  it('mavjud boʻlmagan manzil ham bir xil shaklda javob beradi', async () => {
    const app = createServer(config, fakeDeps)
    const r = await app.inject({ method: 'GET', url: '/api/bunday-manzil-yoq' })
    expect(r.statusCode).toBe(404)
    expect(r.json()).toEqual({
      ok: false,
      error: { code: 'not_found', message: 'Topilmadi' },
    })
    await app.close()
  })

  it('AppXato kodi va holati toʻgʻri oʻgiriladi', async () => {
    const app = createServer(config, fakeDeps)
    app.get('/sinov/ruxsat', async () => {
      throw errors.forbidden()
    })
    const r = await app.inject({ method: 'GET', url: '/sinov/ruxsat' })
    expect(r.statusCode).toBe(403)
    expect(r.json().error).toEqual({
      code: 'forbidden',
      message: 'Bu amal uchun ruxsatingiz yoʻq',
    })
    await app.close()
  })

  it('oʻz matni berilsa oʻsha chiqadi', async () => {
    const app = createServer(config, fakeDeps)
    app.get('/sinov/bemor', async () => {
      throw errors.notFound('Bemor topilmadi')
    })
    const r = await app.inject({ method: 'GET', url: '/sinov/bemor' })
    expect(r.json().error.message).toBe('Bemor topilmadi')
    await app.close()
  })

  it('forma xatolari maydon boʻyicha qaytadi', async () => {
    const app = createServer(config, fakeDeps)
    app.get('/sinov/forma', async () => {
      throw errors.validation({ fio: 'F.I.O. kiritilishi shart' })
    })
    const r = await app.inject({ method: 'GET', url: '/sinov/forma' })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields).toEqual({ fio: 'F.I.O. kiritilishi shart' })
    await app.close()
  })

  it('kutilmagan xato tafsiloti javobga chiqmaydi', async () => {
    const app = createServer(config, fakeDeps)
    app.get('/sinov/portlash', async () => {
      throw new Error('baza paroli notoʻgʻri: postgresql://edentist:maxfiy@host')
    })
    const r = await app.inject({ method: 'GET', url: '/sinov/portlash' })
    expect(r.statusCode).toBe(500)
    expect(r.json().error.code).toBe('internal')
    expect(r.payload).not.toContain('maxfiy')
    expect(r.payload).not.toContain('postgresql')
    await app.close()
  })

  it('buzuq JSON ham oʻzbekcha xato beradi, ichki tafsilotsiz', async () => {
    const app = createServer(config, fakeDeps)
    app.post('/sinov/yozish', async () => ({ ok: true }))
    const r = await app.inject({
      method: 'POST',
      url: '/sinov/yozish',
      headers: { 'content-type': 'application/json' },
      payload: '{buzuq',
    })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.code).toBe('bad_request')
    expect(r.json().error.message).toBe('Soʻrov notoʻgʻri yuborildi')
    await app.close()
  })
})

describe('GET /api/health/ready', () => {
  // Kuzatuv shu manzilni soʻraydi: baza yoki Redis yotgan boʻlsa API
  // «tirik» deb koʻrinib turmasligi kerak
  it('hammasi joyida boʻlsa 200', async () => {
    const app = createServer(config, {
      ...fakeDeps,
      db: { $queryRaw: async () => [{ '?column?': 1 }] } as unknown as Db,
    })
    const r = await app.inject({ method: 'GET', url: '/api/health/ready' })
    expect(r.statusCode).toBe(200)
    expect(r.json()).toMatchObject({ ok: true, data: { status: 'ok' } })
    await app.close()
  })

  it('baza javob bermasa 503', async () => {
    const app = createServer(config, {
      ...fakeDeps,
      db: {
        $queryRaw: async () => {
          throw new Error('ECONNREFUSED')
        },
      } as unknown as Db,
    })
    const r = await app.inject({ method: 'GET', url: '/api/health/ready' })
    expect(r.statusCode).toBe(503)
    await app.close()
  })

  it('Redis javob bermasa 503', async () => {
    const app = createServer(config, {
      ...fakeDeps,
      db: { $queryRaw: async () => [{ '?column?': 1 }] } as unknown as Db,
      sessions: {
        ...fakeDeps.sessions,
        ping: async () => {
          throw new Error('ECONNREFUSED')
        },
      },
    })
    const r = await app.inject({ method: 'GET', url: '/api/health/ready' })
    expect(r.statusCode).toBe(503)
    await app.close()
  })

  // Manzil ochiq — qaysi qism yiqilgani javobda koʻrinmasligi kerak
  it('javobda texnik tafsilot yoʻq', async () => {
    const app = createServer(config, {
      ...fakeDeps,
      db: {
        $queryRaw: async () => {
          throw new Error('parol notoʻgʻri: edentist_app@postgres')
        },
      } as unknown as Db,
    })
    const r = await app.inject({ method: 'GET', url: '/api/health/ready' })
    expect(r.payload).not.toContain('parol')
    expect(r.payload).not.toContain('postgres')
    await app.close()
  })
})

describe('proxy orqasidagi IP', () => {
  // Cheklovlar IP boʻyicha ishlaydi. Caddy haqiqiy manzilni
  // X-Forwarded-For da uzatadi, mijoz esa uni soxtalashtira olmasligi kerak
  function ipOf(headers: Record<string, string>, env: 'production' | 'test') {
    const app = createServer(testConfig({ NODE_ENV: env }), fakeDeps)
    app.get('/sinov/ip', async (req) => ({ ip: req.ip }))
    return app
      .inject({ method: 'GET', url: '/sinov/ip', headers, remoteAddress: '10.0.0.5' })
      .then((r) => {
        const ip = r.json().ip
        return app.close().then(() => ip)
      })
  }

  it('ishlab chiqarishda X-Forwarded-For oxirgi qiymati olinadi', async () => {
    expect(await ipOf({ 'x-forwarded-for': '203.0.113.7' }, 'production')).toBe('203.0.113.7')
  })

  // Mijoz zanjir boshiga soxta manzil qoʻshsa ham u hisobga olinmaydi
  it('soxta X-Forwarded-For zanjiri cheklovni aylanib oʻta olmaydi', async () => {
    expect(await ipOf({ 'x-forwarded-for': '1.2.3.4, 203.0.113.7' }, 'production')).toBe(
      '203.0.113.7',
    )
  })

  it('lokalda sarlavhaga umuman ishonilmaydi', async () => {
    expect(await ipOf({ 'x-forwarded-for': '203.0.113.7' }, 'test')).toBe('10.0.0.5')
  })
})
