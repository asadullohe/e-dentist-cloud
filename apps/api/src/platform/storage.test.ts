// Haqiqiy MinIO bilan ishlaydi — imzolangan havolani soxta obyekt bilan
// tekshirib boʻlmaydi.

import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { testConfig } from '../test-support/config.js'
import { createStorage, imageKey, type Storage } from './storage.js'

const config = testConfig()
let storage: Storage
const keys: string[] = []

beforeAll(async () => {
  storage = createStorage({
    endpoint: config.S3_ENDPOINT,
    accessKey: config.S3_ACCESS_KEY,
    secretKey: config.S3_SECRET_KEY,
    bucket: config.S3_BUCKET,
  })
  await storage.ensureBucket()
}, 30_000)

afterAll(async () => {
  for (const key of keys) await storage.remove(key).catch(() => {})
})

function newKey() {
  const key = imageKey(randomUUID(), randomUUID(), randomUUID(), 'txt')
  keys.push(key)
  return key
}

describe('imageKey', () => {
  it('klinika boʻyicha ajratilgan yoʻl beradi', () => {
    expect(imageKey('c1', 'p1', 'i1', 'jpg')).toBe('clinics/c1/patients/p1/i1.jpg')
  })
})

describe('saqlagich', () => {
  it('bucket yoʻq boʻlsa yaratadi, bor boʻlsa xato bermaydi', async () => {
    await expect(storage.ensureBucket()).resolves.toBeUndefined()
  })

  it('fayl yoziladi va serverning oʻzi oʻqiydi', async () => {
    const key = newKey()
    await storage.put(key, Buffer.from('sinov mazmuni'), 'text/plain')

    const file = await storage.get(key)
    expect(file?.body.toString()).toBe('sinov mazmuni')
    expect(file?.contentType).toBe('text/plain')
  })

  // Ochiq URL orqali kirib boʻlmasligi kerak (tz.md 12-boʻlim)
  it('imzosiz murojaat rad etiladi', async () => {
    const key = newKey()
    await storage.put(key, Buffer.from('maxfiy'), 'text/plain')

    const response = await fetch(`${config.S3_ENDPOINT}/${config.S3_BUCKET}/${key}`)
    expect(response.status).toBe(403)
  })

  it('oʻchirilgandan keyin fayl topilmaydi', async () => {
    const key = newKey()
    await storage.put(key, Buffer.from('vaqtinchalik'), 'text/plain')
    await storage.remove(key)

    expect(await storage.get(key)).toBeNull()
  })
})
