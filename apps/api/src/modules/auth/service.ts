// Kirish, roʻyxatdan oʻtish va pochtani tasdiqlash mantigʻi.
// Boshqa modullar auth ga faqat shu fayl orqali murojaat qiladi.

import { createHash, randomBytes } from 'node:crypto'
import {
  AUTH_TEXT,
  addDays,
  formatDate,
  isDisposableEmail,
  type Permission,
} from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import type { Mailer } from '../../platform/mailer.js'
import { hashPassword, verifyPassword } from '../../platform/password.js'
import type { RateLimiter } from '../../platform/rateLimit.js'
import type { SessionData, SessionStore } from '../../platform/session.js'
import { withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as clinics from '../clinics/service.js'
import * as repo from './repo.js'
import type { LoginInput, RegisterInput } from './schema.js'

const TRIAL_DAYS = 14
const VERIFY_TOKEN_HOURS = 24

// Cheklovlar. Hisob boʻyicha qattiqroq: bitta hisobga parol tanlashni
// toʻsish kerak. IP boʻyicha yumshoqroq: bitta klinikada bir necha xodim
// bitta tarmoqdan kirishi mumkin
const LOGIN_WINDOW = 15 * 60
const LOGIN_ACCOUNT_LIMIT = 5
const LOGIN_IP_LIMIT = 20
const REGISTER_WINDOW = 24 * 60 * 60
const REGISTER_IP_LIMIT = 3

export interface AuthDeps {
  db: Db
  sessions: SessionStore
  rateLimiter: RateLimiter
  mailer: Mailer
  cabinetUrl: string
  log: (message: string, meta?: Record<string, unknown>) => void
}

// Pochta topilmaganda ham parol tekshiruvi bajarilishi kerak: aks holda
// javob vaqti «bunday pochta bormi» degan savolga javob berib qoʻyadi
let dummyHash: string | null = null
async function getDummyHash(): Promise<string> {
  dummyHash ??= await hashPassword(randomBytes(32).toString('hex'))
  return dummyHash
}

function createToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: createHash('sha256').update(token).digest('hex') }
}

function addHours(soat: number): Date {
  return new Date(Date.now() + soat * 60 * 60 * 1000)
}

function isDuplicateEmail(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002'
}

export async function register(
  deps: AuthDeps,
  input: RegisterInput,
  ip: string,
): Promise<{ clinicId: string }> {
  if (isDisposableEmail(input.email)) {
    throw errors.validation({ email: AUTH_TEXT.disposable_email })
  }

  const check = await deps.rateLimiter.hit(`register:ip:${ip}`, REGISTER_IP_LIMIT, REGISTER_WINDOW)
  if (!check.allowed) throw errors.rateLimited(AUTH_TEXT.too_many_registrations)

  // Klinikaning id si bazadan emas, shu yerdan: RLS siyosati yozuvni
  // kiritishdan oldin sessiyada oʻsha id turishini talab qiladi
  const clinicId = uuidV7()
  const userId = uuidV7()
  const { token, hash } = createToken()
  const expiresAt = addDays(TRIAL_DAYS)
  const passwordHash = await hashPassword(input.password)

  try {
    await withClinic(deps.db, clinicId, async (tx) => {
      const { ownerRoleId } = await clinics.createClinicWithRoles(tx, {
        clinicId,
        name: input.clinicName,
        phone: input.phone ?? null,
        expiresAt,
      })
      await repo.createOwner(tx, {
        userId,
        roleId: ownerRoleId,
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        emailVerifyTokenHash: hash,
        emailVerifyExpiresAt: addHours(VERIFY_TOKEN_HOURS),
      })
      await writeAudit(tx, {
        userId,
        action: AUDIT_ACTION.registered,
        entity: 'clinic',
        entityId: clinicId,
        meta: { ip },
      })
    })
  } catch (e) {
    if (isDuplicateEmail(e)) throw errors.conflict(AUTH_TEXT.email_taken)
    throw e
  }

  await deps.mailer.send({
    to: input.email,
    subject: AUTH_TEXT.verify_subject,
    body: [
      'Assalomu alaykum!',
      '',
      `«${input.clinicName}» uchun E-Dentist hisobi yaratildi.`,
      `Sinov muddati ${formatDate(expiresAt.toISOString().slice(0, 10))} gacha.`,
      '',
      'Pochtangizni tasdiqlash uchun quyidagi havolani oching:',
      `${deps.cabinetUrl}/verify?token=${token}`,
      '',
      `Havola ${VERIFY_TOKEN_HOURS} soat amal qiladi.`,
      'Agar bu siz boʻlmasangiz, xatni eʼtiborsiz qoldiring.',
    ].join('\n'),
  })

  return { clinicId }
}

export async function verifyEmail(deps: AuthDeps, token: string): Promise<void> {
  const hash = createHash('sha256').update(token).digest('hex')
  const result = await repo.consumeVerifyToken(deps.db, hash)
  if (!result) throw errors.badRequest(AUTH_TEXT.link_invalid)

  await withClinic(deps.db, result.clinic_id, (tx) =>
    writeAudit(tx, {
      userId: result.user_id,
      action: AUDIT_ACTION.email_verified,
      entity: 'user',
      entityId: result.user_id,
    }),
  )
}

export async function login(deps: AuthDeps, input: LoginInput, ip: string): Promise<string> {
  const ipCheck = await deps.rateLimiter.hit(`login:ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_WINDOW)
  if (!ipCheck.allowed) throw errors.rateLimited(AUTH_TEXT.too_many_attempts)

  const accountKey = `login:account:${input.email}`
  const accountCheck = await deps.rateLimiter.hit(accountKey, LOGIN_ACCOUNT_LIMIT, LOGIN_WINDOW)
  if (!accountCheck.allowed) throw errors.rateLimited(AUTH_TEXT.too_many_attempts)

  const u = await repo.findByEmail(deps.db, input.email)

  if (!u) {
    // Vaqtni tenglashtirish uchun — natija baribir rad etish.
    // Klinika nomaʼlum, shuning uchun audit emas, oddiy log
    await verifyPassword(await getDummyHash(), input.password)
    deps.log('nomaʼlum pochta bilan kirishga urinish', { ip })
    throw errors.unauthorized(AUTH_TEXT.login_failed_msg)
  }

  if (!(await verifyPassword(u.password_hash, input.password))) {
    if (u.clinic_id) {
      await withClinic(deps.db, u.clinic_id, (tx) =>
        writeAudit(tx, {
          userId: u.id,
          action: AUDIT_ACTION.login_failed,
          entity: 'user',
          entityId: u.id,
          meta: { ip },
        }),
      )
    }
    throw errors.unauthorized(AUTH_TEXT.login_failed_msg)
  }

  if (u.status !== 'active') throw errors.forbidden(AUTH_TEXT.account_disabled)
  if (!u.email_verified_at) throw errors.forbidden(AUTH_TEXT.email_not_verified)

  if (u.clinic_id) {
    await withClinic(deps.db, u.clinic_id, async (tx) => {
      await repo.markLogin(tx, u.id)
      await writeAudit(tx, {
        userId: u.id,
        action: AUDIT_ACTION.loggedIn,
        entity: 'user',
        entityId: u.id,
        meta: { ip },
      })
    })
  }

  // Muvaffaqiyatli kirishdan keyin hisob hisoblagichi tozalanadi
  await deps.rateLimiter.reset(accountKey)

  return deps.sessions.create({ userId: u.id, clinicId: u.clinic_id })
}

export async function logout(deps: AuthDeps, sessionId: string, session: SessionData | null) {
  await deps.sessions.destroy(sessionId)
  if (session?.clinicId) {
    await withClinic(deps.db, session.clinicId, (tx) =>
      writeAudit(tx, {
        userId: session.userId,
        action: AUDIT_ACTION.logged_out,
        entity: 'user',
        entityId: session.userId,
      }),
    )
  }
}

/// Ruxsat tekshiruvi shuni chaqiradi (platform/kirish.ts).
///
/// Rol foydalanuvchidan, ruxsatlar roldan — ikkalasi ham har soʻrovda
/// bazadan. Faolsizlantirilgan xodimning ochiq sessiyasi ham shu yerda
/// toʻxtaydi: hisob oʻchirilganda kirish darhol tugashi kerak
export async function userPermissions(
  db: Db,
  clinicId: string,
  userId: string,
): Promise<readonly Permission[]> {
  return withClinic(db, clinicId, async (tx) => {
    const u = await repo.findUser(tx, userId)
    if (!u) throw errors.unauthorized()
    if (u.status !== 'active') throw errors.forbidden(AUTH_TEXT.account_disabled)
    if (!u.roleId) return []
    return clinics.getPermissions(tx, u.roleId)
  })
}

export async function currentUser(deps: AuthDeps, session: SessionData) {
  if (!session.clinicId) throw errors.forbidden() // Platforma admini — bosqich 5.2

  const clinicId = session.clinicId
  return withClinic(deps.db, clinicId, async (tx) => {
    const u = await repo.findUser(tx, session.userId)
    if (!u) throw errors.unauthorized()

    const clinic = await clinics.findClinic(tx, clinicId)
    const role = u.roleId ? await clinics.findRole(tx, u.roleId) : null

    return {
      user: { id: u.id, email: u.email, fullName: u.fullName },
      clinic: clinic,
      role: role ? { name: role.name, template: role.template, isOwner: role.isOwner } : null,
      permissions: role?.permissions ?? [],
    }
  })
}
