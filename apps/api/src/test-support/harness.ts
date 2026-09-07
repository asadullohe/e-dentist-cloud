// Modul testlari uchun tayyor muhit: klinika roʻyxatdan oʻtadi, pochtasi
// tasdiqlanadi va egasi kiradi. Har modulda shu takrorlanmasin uchun.
//
// Haqiqiy baza va Redis bilan ishlaydi — RLS ni soxta obyekt bilan tekshirib
// boʻlmaydi.

import type { FastifyInstance } from 'fastify'
import type { Config } from '../platform/config.js'
import { createDb, type Db } from '../platform/db.js'
import { memoryMailer } from '../platform/mailer.js'
import { createRateLimiter, type RateLimiter } from '../platform/rateLimit.js'
import { createServer } from '../platform/server.js'
import { createSessionStore, type SessionStore } from '../platform/session.js'

const OWNER_URL = process.env.DATABASE_URL
const APP_URL = process.env.APP_DATABASE_URL
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

export interface Harness {
  app: FastifyInstance
  /// Superuser ulanishi — sinov maʼlumotini tayyorlash va tekshirish uchun.
  /// RLS unga taʼsir qilmaydi
  ownerDb: Db
  cookie: string
  clinicId: string
  userId: string
  email: string
  stop(): Promise<void>
}

export async function startHarness(): Promise<Harness> {
  if (!OWNER_URL || !APP_URL) {
    throw new Error('DATABASE_URL va APP_DATABASE_URL kerak — «npm run up» bilan bazani koʻtaring')
  }

  const config: Config = {
    NODE_ENV: 'test',
    API_PORT: 3000,
    TZ: 'Asia/Tashkent',
    CABINET_URL: 'http://localhost:5173',
    DATABASE_URL: OWNER_URL,
    APP_DATABASE_URL: APP_URL,
    REDIS_URL,
    SESSION_SECRET: 'x'.repeat(16),
  }

  const ownerDb = createDb(OWNER_URL)
  const db = createDb(APP_URL)
  const sessions: SessionStore = createSessionStore(REDIS_URL)
  const rateLimiter: RateLimiter = createRateLimiter(REDIS_URL)
  const mailer = memoryMailer()

  const email = `harness-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`

  // Hisoblagichlar Redis da qoladi — oldingi ishga tushirishdan qolgani
  // testni yiqitmasin
  for (const key of ['register:ip:127.0.0.1', 'login:ip:127.0.0.1', `login:account:${email}`]) {
    await rateLimiter.reset(key)
  }

  const app = createServer(config, { db, sessions, rateLimiter, mailer })
  await app.ready()

  const registered = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      clinicName: `Sinov klinikasi ${Date.now()}`,
      fullName: 'Sinov Egasi',
      email,
      password: 'juda-yaxshi-parol',
    },
  })
  const clinicId = registered.json().data.clinicId as string

  const token = /token=([\w-]+)/.exec(mailer.sent.at(-1)?.body ?? '')?.[1] ?? ''
  await app.inject({ method: 'POST', url: '/api/auth/verify', payload: { token } })

  const loggedIn = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password: 'juda-yaxshi-parol' },
  })
  const cookie = `ed_session=${loggedIn.cookies.find((c) => c.name === 'ed_session')?.value}`

  const owner = await ownerDb.user.findFirst({ where: { clinicId } })

  return {
    app,
    ownerDb,
    cookie,
    clinicId,
    userId: owner?.id ?? '',
    email,
    async stop() {
      await removeClinic(ownerDb, clinicId)
      await app.close()
      await sessions.close()
      await rateLimiter.close()
      await ownerDb.$disconnect()
      await db.$disconnect()
    },
  }
}

/// Tashqi kalitlar tartibida: avval bogʻliqlar, keyin bemor va klinika
export async function removeClinic(ownerDb: Db, clinicId: string): Promise<void> {
  const where = { where: { clinicId } }
  await ownerDb.auditLog.deleteMany(where)
  await ownerDb.payment.deleteMany(where)
  await ownerDb.appointment.deleteMany(where)
  await ownerDb.visit.deleteMany(where)
  await ownerDb.tooth.deleteMany(where)
  await ownerDb.bridge.deleteMany(where)
  await ownerDb.patientImage.deleteMany(where)
  await ownerDb.patient.deleteMany(where)
  await ownerDb.service.deleteMany(where)
  await ownerDb.invite.deleteMany(where)
  await ownerDb.user.deleteMany(where)
  await ownerDb.role.deleteMany(where)
  await ownerDb.clinic.deleteMany({ where: { id: clinicId } })
}
