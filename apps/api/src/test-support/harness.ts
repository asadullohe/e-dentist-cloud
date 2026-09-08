// Modul testlari uchun tayyor muhit: klinika roʻyxatdan oʻtadi, pochtasi
// tasdiqlanadi va egasi kiradi. Har modulda shu takrorlanmasin uchun.
//
// Haqiqiy baza va Redis bilan ishlaydi — RLS ni soxta obyekt bilan tekshirib
// boʻlmaydi.

import type { FastifyInstance } from 'fastify'
import { generateQueueCode } from '../modules/clinics/queueCode.js'
import { memoryBus } from '../platform/bus.js'
import { createDb, type Db } from '../platform/db.js'
import { createImportStore } from '../platform/importStore.js'
import { type Mail, memoryMailer } from '../platform/mailer.js'
import { createRateLimiter, type RateLimiter } from '../platform/rateLimit.js'
import { createServer } from '../platform/server.js'
import { createSessionStore, type SessionStore } from '../platform/session.js'
import { createStorage } from '../platform/storage.js'
import { testConfig } from './config.js'

const OWNER_URL = process.env.DATABASE_URL
const APP_URL = process.env.APP_DATABASE_URL
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

const rnd = () => Math.floor(Math.random() * 250) + 1

export interface Harness {
  app: FastifyInstance
  /// Shu nusxaning mijoz IP si. Test fayllari parallel ishlaydi va
  /// roʻyxatdan oʻtish chegarasi IP boʻyicha sanaladi — bir xil IP dan
  /// kirishsa, biri ikkinchisining hisobini yeb qoʻyadi
  clientIp: string
  /// Superuser ulanishi — sinov maʼlumotini tayyorlash va tekshirish uchun.
  /// RLS unga taʼsir qilmaydi
  ownerDb: Db
  /// Yuborilgan xatlar — havoladagi kalitni shu yerdan olamiz
  sentMail: Mail[]
  /// Navbat hodisalari shinasi (SSE)
  bus: ReturnType<typeof memoryBus>
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

  const config = testConfig({ DATABASE_URL: OWNER_URL, APP_DATABASE_URL: APP_URL })

  const ownerDb = createDb(OWNER_URL)
  const db = createDb(APP_URL)
  const sessions: SessionStore = createSessionStore(REDIS_URL)
  const rateLimiter: RateLimiter = createRateLimiter(REDIS_URL)
  const mailer = memoryMailer()

  const email = `harness-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
  const clientIp = `10.${rnd()}.${rnd()}.${rnd()}`

  // Hisoblagichlar Redis da qoladi — oldingi ishga tushirishdan qolgani
  // testni yiqitmasin
  for (const key of [`register:ip:${clientIp}`, `login:ip:${clientIp}`, `login:account:${email}`]) {
    await rateLimiter.reset(key)
  }

  const storage = createStorage({
    endpoint: config.S3_ENDPOINT,
    accessKey: config.S3_ACCESS_KEY,
    secretKey: config.S3_SECRET_KEY,
    bucket: config.S3_BUCKET,
  })
  await storage.ensureBucket()

  const imports = createImportStore(REDIS_URL)

  const bus = memoryBus()
  const app = createServer(config, {
    db,
    storage,
    imports,
    sessions,
    rateLimiter,
    mailer,
    bus,
  })
  await app.ready()

  const registered = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    remoteAddress: clientIp,
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
    remoteAddress: clientIp,
    payload: { email, password: 'juda-yaxshi-parol' },
  })
  const cookie = `ed_session=${loggedIn.cookies.find((c) => c.name === 'ed_session')?.value}`

  const owner = await ownerDb.user.findFirst({ where: { clinicId } })

  return {
    app,
    clientIp,
    ownerDb,
    sentMail: mailer.sent,
    bus,
    cookie,
    clinicId,
    userId: owner?.id ?? '',
    email,
    async stop() {
      await removeClinic(ownerDb, clinicId)
      await app.close()
      await sessions.close()
      await rateLimiter.close()
      await imports.close()
      await ownerDb.$disconnect()
      await db.$disconnect()
    },
  }
}

/// «B klinikasi» — koʻp ijarachilik testlari uchun. Har jadval uchun
/// takrorlanmasin deb shu yerda
export function createOtherClinic(ownerDb: Db, name = 'B klinikasi') {
  return ownerDb.clinic.create({
    data: { name, expiresAt: new Date('2030-01-01'), queueCode: generateQueueCode() },
  })
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
  await ownerDb.labOrder.deleteMany(where)
  await ownerDb.patient.deleteMany(where)
  await ownerDb.service.deleteMany(where)
  await ownerDb.expense.deleteMany(where)
  await ownerDb.invite.deleteMany(where)
  await ownerDb.user.deleteMany(where)
  await ownerDb.role.deleteMany(where)
  await ownerDb.clinic.deleteMany({ where: { id: clinicId } })
}
