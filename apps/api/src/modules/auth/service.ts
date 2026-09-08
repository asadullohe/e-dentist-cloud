// Kirish, roʻyxatdan oʻtish va pochtani tasdiqlash mantigʻi.
// Boshqa modullar auth ga faqat shu fayl orqali murojaat qiladi.

import { createHash, randomBytes } from 'node:crypto'
import {
  AUTH_TEXT,
  addDays,
  formatDate,
  isDisposableEmail,
  type Permission,
  STAFF_TEXT,
} from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import type { Mailer } from '../../platform/mailer.js'
import { hashPassword, verifyPassword } from '../../platform/password.js'
import type { RateLimiter } from '../../platform/rateLimit.js'
import type { SessionData, SessionStore } from '../../platform/session.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as clinics from '../clinics/service.js'
import * as repo from './repo.js'
import type {
  InviteAcceptInput,
  InviteInput,
  LoginInput,
  RegisterInput,
  StaffUpdateInput,
} from './schema.js'

const TRIAL_DAYS = 14
const VERIFY_TOKEN_HOURS = 24
const INVITE_DAYS = 7

// Taklifnoma bilan hisob ochish ham roʻyxatdan oʻtish — bir IP dan
// koʻp urinish shubhali
const INVITE_IP_LIMIT = 10

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

// ─────────────────────  Xodimlar va taklifnomalar  ─────────────────────
//
// `users` jadvali shu modulniki, `invites` esa clinics niki. Shuning uchun
// taklifnoma yozuvi bilan ishlash clinics ning xizmat qatlami orqali boradi

export interface StaffMember {
  id: string
  email: string
  fullName: string | null
  roleId: string | null
  roleName: string | null
  status: 'active' | 'disabled'
  lastLoginAt: Date | null
}

/// Boshqa modullar uchun (lab): xodim ismlari. Ochiq tranzaksiya ichida
export async function staffNamesTx(tx: ClinicTx, ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const rows = await repo.findStaffByIds(tx, ids)
  return new Map(rows.map((row) => [row.id, row.fullName ?? '']))
}

/// Xodim shu klinikada bormi — naryadga texnik tayinlashda tekshiriladi
export async function existsInClinic(tx: ClinicTx, userId: string): Promise<boolean> {
  return (await repo.findStaff(tx, userId)) !== null
}

/// Qabul qiluvchi shifokorlar: roli `visits.write` ni beradigan faol
/// xodimlar. Rol nomiga qaramaymiz — klinika shablonni oʻzgartirgan
/// boʻlishi mumkin. Ochiq navbat sahifasi shu roʻyxatni koʻrsatadi
export async function listDoctorsTx(tx: ClinicTx): Promise<{ id: string; fullName: string }[]> {
  const roles = await clinics.listRolesTx(tx)
  const treating = new Set(
    roles.filter((role) => role.permissions.includes('visits.write')).map((role) => role.id),
  )
  if (treating.size === 0) return []

  const people = await repo.listStaff(tx)
  return people
    .filter((person) => person.status === 'active' && person.roleId && treating.has(person.roleId))
    .map((person) => ({ id: person.id, fullName: person.fullName ?? '' }))
}

/// Faqat ism va id. Naryadga texnik tayinlash uchun `lab.write` boriga
/// ochiq — toʻliq roʻyxatda pochta, holat va oxirgi kirish bor, ular
/// `staff.manage` ishi
export function listStaffNames(deps: AuthDeps, clinicId: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const people = await repo.listStaff(tx)
    return people
      .filter((person) => person.status === 'active')
      .map((person) => ({ id: person.id, fullName: person.fullName }))
  })
}

export function listStaff(deps: AuthDeps, clinicId: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const [people, roles, invites] = await Promise.all([
      repo.listStaff(tx),
      clinics.listRolesTx(tx),
      clinics.listPendingInvitesTx(tx),
    ])
    const roleName = new Map(roles.map((role) => [role.id, role.name]))

    const staff: StaffMember[] = people.map((person) => ({
      id: person.id,
      email: person.email,
      fullName: person.fullName,
      roleId: person.roleId,
      roleName: person.roleId ? (roleName.get(person.roleId) ?? null) : null,
      status: person.status,
      lastLoginAt: person.lastLoginAt,
    }))

    return {
      staff,
      invites: invites.map((invite) => ({
        id: invite.id,
        email: invite.email,
        roleId: invite.roleId,
        roleName: roleName.get(invite.roleId) ?? null,
        expiresAt: invite.expiresAt,
      })),
    }
  })
}

export async function invite(
  deps: AuthDeps,
  clinicId: string,
  userId: string,
  input: InviteInput,
): Promise<{ id: string }> {
  const { token, hash } = createToken()
  const id = uuidV7()
  const expiresAt = addDays(INVITE_DAYS)

  const clinicName = await withClinic(deps.db, clinicId, async (tx) => {
    const role = await clinics.findRoleByIdTx(tx, input.roleId)
    if (!role) throw errors.notFound(STAFF_TEXT.role_not_found)

    // Pochta klinika ichida band boʻlmasligi kerak. Boshqa klinikada band
    // boʻlsa ham hisob ocha olmaydi — users.email butun bazada yagona
    const existing = await tx.user.findFirst({ where: { email: input.email } })
    if (existing) throw errors.conflict(STAFF_TEXT.email_taken)

    const pending = await clinics.findPendingInviteByEmailTx(tx, input.email)
    if (pending) throw errors.conflict(STAFF_TEXT.invite_exists)

    await clinics.createInviteTx(tx, {
      id,
      roleId: input.roleId,
      email: input.email,
      tokenHash: hash,
      expiresAt,
    })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.staff_changed,
      entity: 'invite',
      entityId: id,
      meta: { email: input.email },
    })

    const clinic = await clinics.findClinic(tx, clinicId)
    return clinic?.name ?? ''
  })

  await deps.mailer.send({
    to: input.email,
    subject: STAFF_TEXT.invite_subject,
    body: [
      `${clinicName} sizni E-Dentist kabinetiga taklif qildi.`,
      '',
      'Hisob ochish uchun havolani oching:',
      `${deps.cabinetUrl}/invite?token=${token}`,
      '',
      `Havola ${formatDate(expiresAt.toISOString().slice(0, 10))} gacha amal qiladi.`,
      'Agar bu siz boʻlmasangiz, xatni eʼtiborsiz qoldiring.',
    ].join('\n'),
  })

  return { id }
}

export function revokeInvite(deps: AuthDeps, clinicId: string, userId: string, id: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      await clinics.deleteInviteTx(tx, id)
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        (error as { code?: string }).code === 'P2025'
      ) {
        throw errors.notFound(STAFF_TEXT.invite_not_found)
      }
      throw error
    }
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.staff_changed,
      entity: 'invite',
      entityId: id,
    })
  })
}

/// Rol yoki holatni oʻzgartirish. Uchta himoya (tz.md 6-boʻlim):
///   1. oʻzini oʻzgartira olmaydi
///   2. oxirgi faol egasi qolishi shart
///   3. rol shu klinikaniki boʻlishi kerak — buni ijarachi qatlami ushlaydi
export function updateStaff(
  deps: AuthDeps,
  clinicId: string,
  actorId: string,
  targetId: string,
  input: StaffUpdateInput,
) {
  if (actorId === targetId) throw errors.badRequest(STAFF_TEXT.self_change)

  return withClinic(deps.db, clinicId, async (tx) => {
    const target = await repo.findStaff(tx, targetId)
    if (!target) throw errors.notFound(STAFF_TEXT.not_found)

    const roles = await clinics.listRolesTx(tx)
    const ownerRoleIds = roles.filter((role) => role.isOwner).map((role) => role.id)

    if (input.roleId && !roles.some((role) => role.id === input.roleId)) {
      throw errors.notFound(STAFF_TEXT.role_not_found)
    }

    // Egalikdan chiqarish yoki faolsizlantirish — oxirgi egani yoʻqotmasin
    const wasOwner = target.roleId !== null && ownerRoleIds.includes(target.roleId)
    const staysOwner = input.roleId ? ownerRoleIds.includes(input.roleId) : wasOwner
    const staysActive = input.status ? input.status === 'active' : target.status === 'active'

    if (wasOwner && target.status === 'active' && !(staysOwner && staysActive)) {
      const activeOwners = await repo.countActiveByRoles(tx, ownerRoleIds)
      if (activeOwners <= 1) throw errors.badRequest(STAFF_TEXT.last_owner)
    }

    const updated = await repo.updateStaff(tx, targetId, {
      ...(input.roleId === undefined ? {} : { roleId: input.roleId }),
      ...(input.status === undefined ? {} : { status: input.status }),
    })
    await writeAudit(tx, {
      userId: actorId,
      action: input.roleId ? AUDIT_ACTION.role_changed : AUDIT_ACTION.staff_changed,
      entity: 'user',
      entityId: targetId,
      meta: { ...input },
    })
    return updated
  })
}

/// Havolani ochganda koʻrsatiladigan maʼlumot. Sessiya yoʻq
export async function inviteInfo(deps: AuthDeps, token: string) {
  const hash = createHash('sha256').update(token).digest('hex')
  const invite = await clinics.findInviteByToken(deps.db, hash)
  if (!invite) throw errors.notFound(STAFF_TEXT.invite_not_found)
  if (invite.accepted_at || invite.expires_at <= new Date()) {
    throw errors.badRequest(STAFF_TEXT.invite_expired)
  }
  return {
    email: invite.email,
    clinicName: invite.clinic_name,
    roleName: invite.role_name,
  }
}

/// Taklifnoma boʻyicha hisob ochish va darhol kirish: havola pochta
/// egaligini isbotlagan, ikkinchi marta tasdiqlash soʻralmaydi
export async function acceptInvite(
  deps: AuthDeps,
  input: InviteAcceptInput,
  ip: string,
): Promise<string> {
  const check = await deps.rateLimiter.hit(`invite:ip:${ip}`, INVITE_IP_LIMIT, REGISTER_WINDOW)
  if (!check.allowed) throw errors.rateLimited(AUTH_TEXT.too_many_registrations)

  const hash = createHash('sha256').update(input.token).digest('hex')
  const invite = await clinics.findInviteByToken(deps.db, hash)
  if (!invite) throw errors.notFound(STAFF_TEXT.invite_not_found)
  if (invite.accepted_at || invite.expires_at <= new Date()) {
    throw errors.badRequest(STAFF_TEXT.invite_expired)
  }

  const userId = uuidV7()
  const passwordHash = await hashPassword(input.password)

  await withClinic(deps.db, invite.clinic_id, async (tx) => {
    try {
      await repo.createInvited(tx, {
        userId,
        roleId: invite.role_id,
        email: invite.email,
        passwordHash,
        fullName: input.fullName,
      })
    } catch (error) {
      if (isDuplicateEmail(error)) throw errors.conflict(STAFF_TEXT.email_taken)
      throw error
    }
    await clinics.markInviteAcceptedTx(tx, invite.id)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.staff_changed,
      entity: 'user',
      entityId: userId,
      meta: { invite: invite.id },
    })
  })

  return deps.sessions.create({ userId, clinicId: invite.clinic_id })
}
