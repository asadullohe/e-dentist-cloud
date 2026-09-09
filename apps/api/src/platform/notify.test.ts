import { afterEach, describe, expect, it, vi } from 'vitest'
import { telegramNotifier } from './notify.js'

const logged: { message: string; meta?: Record<string, unknown> }[] = []
const notifier = telegramNotifier({
  token: 'sinov-token',
  chatId: '42',
  log: (message, meta) => logged.push({ message, ...(meta ? { meta } : {}) }),
})

afterEach(() => {
  logged.length = 0
  vi.unstubAllGlobals()
})

describe('telegram xabarnomasi', () => {
  it('bot manziliga xabar yuboradi', async () => {
    const calls: { url: string; body: unknown }[] = []
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) })
      return new Response('{"ok":true}', { status: 200 })
    })

    await notifier.send('Yangi klinika')

    expect(calls[0]?.url).toBe('https://api.telegram.org/botsinov-token/sendMessage')
    expect(calls[0]?.body).toMatchObject({ chat_id: '42', text: 'Yangi klinika' })
  })

  // Xabar yuborish hech qachon asosiy amalni buzmaydi
  it('telegram xato qaytarsa ham tashlamaydi', async () => {
    vi.stubGlobal('fetch', async () => new Response('nope', { status: 429 }))

    await expect(notifier.send('Yangi klinika')).resolves.toBeUndefined()
    expect(logged[0]?.message).toMatch(/yuborilmadi/)
  })

  it('tarmoq yotgan boʻlsa ham tashlamaydi', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('ECONNREFUSED')
    })

    await expect(notifier.send('Yangi klinika')).resolves.toBeUndefined()
    expect(logged[0]?.message).toMatch(/aloqa yoʻq/)
  })
})
