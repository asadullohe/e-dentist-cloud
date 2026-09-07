// 1.4 ning asosiy talabi: javob shakli hamma yerda bir xil boʻlishi va
// texnik tafsilot foydalanuvchiga hech qachon chiqmasligi.

import { describe, expect, it } from 'vitest'
import type { Config } from './platform/config.js'
import { xato } from './platform/errors.js'
import { yaratServer } from './platform/server.js'

const config: Config = {
  NODE_ENV: 'test',
  API_PORT: 3000,
  TZ: 'Asia/Tashkent',
  DATABASE_URL: 'postgresql://x',
  REDIS_URL: 'redis://x',
  SESSION_SECRET: 'x'.repeat(16),
}

describe('GET /api/health', () => {
  it('ok shaklida javob beradi', async () => {
    const app = yaratServer(config)
    const r = await app.inject({ method: 'GET', url: '/api/health' })
    expect(r.statusCode).toBe(200)
    expect(r.json()).toMatchObject({ ok: true, data: { status: 'ok' } })
    await app.close()
  })

  it('sanani KK/OO/YYYY emas, YYYY-MM-DD da qaytaradi (API shakli)', async () => {
    const app = yaratServer(config)
    const r = await app.inject({ method: 'GET', url: '/api/health' })
    expect(r.json().data.sana).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    await app.close()
  })
})

describe('xato javoblari', () => {
  it('mavjud boʻlmagan manzil ham bir xil shaklda javob beradi', async () => {
    const app = yaratServer(config)
    const r = await app.inject({ method: 'GET', url: '/api/bunday-manzil-yoq' })
    expect(r.statusCode).toBe(404)
    expect(r.json()).toEqual({
      ok: false,
      error: { code: 'not_found', message: 'Topilmadi' },
    })
    await app.close()
  })

  it('AppXato kodi va holati toʻgʻri oʻgiriladi', async () => {
    const app = yaratServer(config)
    app.get('/sinov/ruxsat', async () => {
      throw xato.forbidden()
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
    const app = yaratServer(config)
    app.get('/sinov/bemor', async () => {
      throw xato.notFound('Bemor topilmadi')
    })
    const r = await app.inject({ method: 'GET', url: '/sinov/bemor' })
    expect(r.json().error.message).toBe('Bemor topilmadi')
    await app.close()
  })

  it('forma xatolari maydon boʻyicha qaytadi', async () => {
    const app = yaratServer(config)
    app.get('/sinov/forma', async () => {
      throw xato.validation({ fio: 'F.I.O. kiritilishi shart' })
    })
    const r = await app.inject({ method: 'GET', url: '/sinov/forma' })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields).toEqual({ fio: 'F.I.O. kiritilishi shart' })
    await app.close()
  })

  it('kutilmagan xato tafsiloti javobga chiqmaydi', async () => {
    const app = yaratServer(config)
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
    const app = yaratServer(config)
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
