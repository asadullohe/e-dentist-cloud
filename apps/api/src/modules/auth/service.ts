// Kirish, roʻyxatdan oʻtish va pochtani tasdiqlash mantigʻi.
// Boshqa modullar auth ga faqat shu fayl orqali murojaat qiladi.

import { createHash, randomBytes } from 'node:crypto'
import {
  AUTH_TEXT,
  addDays,
  formatDate,
  INVITE_TEXT,
  isDisposableEmail,
  type Permission,
  resolveClinicName,
  roleLabel,
  SOLO_MAX_ASSISTANTS,
  STAFF_TEXT,
} from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import type { Mailer } from '../../platform/mailer.js'
import type { Notifier } from '../../platform/notify.js'
import { hashPassword, verifyPassword } from '../../platform/password.js'
import type { RateLimiter } from '../../platform/rateLimit.js'
import type { SessionData, SessionStore } from '../../platform/session.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as billing from '../billing/service.js'
import * as clinics from '../clinics/service.js'
import * as repo from './repo.js'
import type {
  InviteAcceptInput,
  LoginInput,
  PasswordChangeInput,
  RegisterInput,
  StaffCreateInput,
  StaffUpdateInput,
} from './schema.js'

const TRIAL_DAYS = 14
const VERIFY_TOKEN_HOURS = 24
/// Taklifnoma xatdan yoʻqolib ketsa panel qayta yuboradi — shuning uchun
/// muddat uzoq boʻlishi shart emas
const INVITE_DAYS = 7

// Cheklovlar. Hisob boʻyicha qattiqroq: bitta hisobga parol tanlashni
// toʻsish kerak. IP boʻyicha yumshoqroq: bitta klinikada bir necha xodim
// bitta tarmoqdan kirishi mumkin
const LOGIN_WINDOW = 15 * 60
const LOGIN_ACCOUNT_LIMIT = 5
const LOGIN_IP_LIMIT = 20
const REGISTER_WINDOW = 24 * 60 * 60
const REGISTER_IP_LIMIT = 3
const INVITE_IP_LIMIT = 20

export interface AuthDeps {
  db: Db
  sessions: SessionStore
  rateLimiter: RateLimiter
  mailer: Mailer
  /// Yangi klinika haqida platforma egasiga xabar (Telegram)
  notify: Notifier
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
  const clinicName = resolveClinicName(input.kind, input.clinicName, input.fullName)
  const { token, hash } = createToken()
  const expiresAt = addDays(TRIAL_DAYS)
  const passwordHash = await hashPassword(input.password)

  try {
    await withClinic(deps.db, clinicId, async (tx) => {
      const { ownerRoleId } = await clinics.createClinicWithRoles(tx, {
        clinicId,
        name: clinicName,
        kind: input.kind,
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
      `«${clinicName}» uchun E-Dentist hisobi yaratildi.`,
      `Sinov muddati ${formatDate(expiresAt.toISOString().slice(0, 10))} gacha.`,
      '',
      'Pochtangizni tasdiqlash uchun quyidagi havolani oching:',
      `${deps.cabinetUrl}/verify?token=${token}`,
      '',
      `Havola ${VERIFY_TOKEN_HOURS} soat amal qiladi.`,
      'Agar bu siz boʻlmasangiz, xatni eʼtiborsiz qoldiring.',
    ].join('\n'),
  })

  // Xabarnoma oxirida va himoyalangan holda: klinika allaqachon
  // yaratilgan, xabar yuborilmagani uchun roʻyxatdan oʻtishni
  // yiqitib boʻlmaydi
  try {
    await deps.notify.send(
      [
        input.kind === 'solo'
          ? 'Yangi yakka shifokor roʻyxatdan oʻtdi'
          : 'Yangi klinika roʻyxatdan oʻtdi',
        `Nomi: ${clinicName}`,
        `Egasi: ${input.fullName} (${input.email})`,
        input.phone ? `Telefon: ${input.phone}` : '',
        `Sinov: ${formatDate(expiresAt.toISOString().slice(0, 10))} gacha`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
  } catch (error) {
    deps.log('platforma xabarnomasi yuborilmadi', { error: String(error) })
  }

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

// ─────────────────────────  Taklifnoma  ─────────────────────────
//
// Panel klinika ochganda egasining paroli hech kimga maʼlum boʻlmasligi
// kerak: server tasodifiy kalit yozadi, xatga havola ketadi, parolni
// egasining oʻzi qoʻyadi. Admin uni na koʻradi, na tanlaydi.

export interface InviteMailDeps {
  mailer: Mailer
  cabinetUrl: string
}

/// Ochiq tranzaksiya ichida — chaqiruvchi klinika sessiyasini allaqachon ochgan
export async function createInvite(
  tx: ClinicTx,
  m: { roleId: string; email: string },
): Promise<{ token: string; expiresAt: Date }> {
  const { token, hash } = createToken()
  const expiresAt = addDays(INVITE_DAYS)

  // Eski qabul qilinmagan havolalar oʻchadi: pochtada bir vaqtda ikkita
  // amal qiluvchi havola yotmasin
  await repo.deletePendingInvites(tx, m.email)
  await repo.createInvite(tx, {
    inviteId: uuidV7(),
    roleId: m.roleId,
    email: m.email,
    tokenHash: hash,
    expiresAt,
  })

  return { token, expiresAt }
}

export async function sendInviteMail(
  deps: InviteMailDeps,
  m: { email: string; clinicName: string; token: string },
): Promise<void> {
  await deps.mailer.send({
    to: m.email,
    subject: INVITE_TEXT.subject,
    body: [
      'Assalomu alaykum!',
      '',
      `«${m.clinicName}» uchun E-Dentist kabineti ochildi.`,
      '',
      'Parol belgilash uchun quyidagi havolani oching:',
      `${deps.cabinetUrl}/taklif?token=${m.token}`,
      '',
      INVITE_TEXT.expired_days(INVITE_DAYS),
      'Agar bu siz boʻlmasangiz, xatni eʼtiborsiz qoldiring.',
    ].join('\n'),
  })
}

/// Panel klinika ochishdan oldin tekshiradi: band pochtaga taklifnoma
/// yuborilsa, klinika yaratilib, qabul qilish bosqichida yiqilardi
export async function emailTaken(db: Db, email: string): Promise<boolean> {
  return (await repo.findByEmail(db, email)) !== null
}

/// Qabul qilinmagan taklifnoma — panelda «Taklif yuborilgan» holati va
/// qayta yuborish uchun
export function pendingInvite(tx: ClinicTx) {
  return repo.pendingInvite(tx)
}

async function findValidInvite(deps: AuthDeps, token: string) {
  const hash = createHash('sha256').update(token).digest('hex')
  const invite = await repo.findInvite(deps.db, hash)

  if (!invite) throw errors.badRequest(INVITE_TEXT.link_invalid)
  // Ishlatilgani va muddati oʻtgani alohida xabar beradi: birinchisida
  // odam kirishi kerak, ikkinchisida yangi havola soʻrashi
  if (invite.accepted_at) throw errors.badRequest(INVITE_TEXT.link_used)
  if (invite.expires_at.getTime() < Date.now()) throw errors.badRequest(INVITE_TEXT.link_invalid)

  return invite
}

export interface InviteInfo {
  clinicName: string
  email: string
  roleName: string
}

/// Sahifa ochilganda: kimga va qaysi klinikaga taklif qilinganini koʻrsatish
export async function inviteInfo(deps: AuthDeps, token: string): Promise<InviteInfo> {
  const invite = await findValidInvite(deps, token)
  return { clinicName: invite.clinic_name, email: invite.email, roleName: invite.role_name }
}

/// Qabul qilish: hisob yaratiladi va odam darhol kabinetga kiradi —
/// havolani bosgan odam pochtaga egaligini allaqachon isbotladi
export async function acceptInvite(
  deps: AuthDeps,
  input: InviteAcceptInput,
  ip: string,
): Promise<string> {
  const check = await deps.rateLimiter.hit(`invite:ip:${ip}`, INVITE_IP_LIMIT, LOGIN_WINDOW)
  if (!check.allowed) throw errors.rateLimited(AUTH_TEXT.too_many_attempts)

  const invite = await findValidInvite(deps, input.token)

  // Pochta band boʻlsa taklifnoma ishlamaydi: bitta pochta — bitta hisob
  if (await repo.findByEmail(deps.db, invite.email)) {
    throw errors.conflict(INVITE_TEXT.email_taken)
  }

  const userId = uuidV7()
  const passwordHash = await hashPassword(input.password)

  try {
    await withClinic(deps.db, invite.clinic_id, async (tx) => {
      await repo.createStaff(tx, {
        userId,
        roleId: invite.role_id,
        email: invite.email,
        passwordHash,
        fullName: input.fullName,
        // Ish haqi shartini egasi keyin Sozlamalarda belgilaydi
        salaryAmount: 0,
        payPercent: 0,
      })
      await repo.markInviteAccepted(tx, invite.id)
      await writeAudit(tx, {
        userId,
        action: AUDIT_ACTION.invite_accepted,
        entity: 'user',
        entityId: userId,
        meta: { ip },
      })
    })
  } catch (e) {
    if (isDuplicateEmail(e)) throw errors.conflict(INVITE_TEXT.email_taken)
    throw e
  }

  return deps.sessions.create({ userId, clinicId: invite.clinic_id })
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

  // Admin sessiyasi kabinetda ochilsa /me doim 403 qaytaradi va foydalanuvchi
  // berk koʻchada qoladi: kirish sahifasi ham, «Chiqish» ham yoʻq. Parol
  // toʻgʻri boʻlgandan keyingina aytiladi — hisob turi begonaga oshkor boʻlmaydi
  if (input.app === 'cabinet' && !u.clinic_id) throw errors.forbidden(AUTH_TEXT.admin_account)
  if (input.app === 'admin' && u.clinic_id) throw errors.forbidden(AUTH_TEXT.clinic_account)

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
/// Koʻrish doirasi (tz.md 20-boʻlim): assistent — biriktirilgan
/// shifokorlari, qolganlar — oʻzi. Bogʻlanish rol assistentdan boshqaga
/// oʻtganda olinadi, shuning uchun bogʻlanish bor = assistent.
/// Faolsizlantirilgan shifokor doirada qolmaydi — uning bemorlari
/// assistentga ochiq qolmasin
async function scopeOfTx(tx: ClinicTx, userId: string): Promise<string[]> {
  const linked = await repo.doctorIdsOf(tx, userId)
  if (linked.length === 0) return [userId]
  return repo.activeIds(tx, linked)
}

export async function userAccess(
  db: Db,
  clinicId: string,
  userId: string,
): Promise<{ permissions: readonly Permission[]; doctorIds: readonly string[] }> {
  return withClinic(db, clinicId, async (tx) => {
    const u = await repo.findUser(tx, userId)
    if (!u) throw errors.unauthorized()
    if (u.status !== 'active') throw errors.forbidden(AUTH_TEXT.account_disabled)
    const doctorIds = await scopeOfTx(tx, userId)
    if (!u.roleId) return { permissions: [], doctorIds }
    return { permissions: await clinics.getPermissions(tx, u.roleId), doctorIds }
  })
}

export async function currentUser(deps: AuthDeps, session: SessionData) {
  // Platforma admini — uning oʻz /admin/me si bor (bosqich 5.2). Kabinetga
  // eski yoki `app` siz ochilgan sessiya bilan kelsa, sababi aniq aytilsin
  if (!session.clinicId) throw errors.forbidden(AUTH_TEXT.admin_account)

  const clinicId = session.clinicId
  return withClinic(deps.db, clinicId, async (tx) => {
    const u = await repo.findUser(tx, session.userId)
    if (!u) throw errors.unauthorized()

    const clinic = await clinics.findClinic(tx, clinicId)
    const role = u.roleId ? await clinics.findRole(tx, u.roleId) : null

    return {
      user: { id: u.id, email: u.email, fullName: u.fullName },
      clinic: clinic,
      // Interfeys yozish tugmalarini oʻchirishi uchun — server baribir
      // oʻzi tekshiradi
      subscription: clinic ? billing.subscriptionOf(clinic) : null,
      role: role ? { name: role.name, template: role.template, isOwner: role.isOwner } : null,
      permissions: role?.permissions ?? [],
      // Kimning bemorlari va qabullari: shifokor — oʻzi, assistent —
      // shifokorlari. Interfeys shifokor tanlovini shu bilan toraytiradi
      scopeDoctorIds: await scopeOfTx(tx, u.id),
    }
  })
}

// ───────────────────────────  Xodimlar  ───────────────────────────
//
// `users` jadvali shu modulniki. Rollar `clinics` da — ular oʻsha
// modulning xizmat qatlami orqali oʻqiladi

export interface StaffMember {
  id: string
  email: string
  fullName: string | null
  roleId: string | null
  roleName: string | null
  /// Shablon: interfeys assistentni shu bilan taniydi (tz.md 20-boʻlim)
  roleTemplate: string | null
  /// Assistent kimga yordam beradi; boshqa rollarda boʻsh
  doctorIds: string[]
  status: 'active' | 'disabled'
  /// Ish haqi sharti: oylik (soʻm) va ish narxidan foiz (tz.md 15-boʻlim)
  salaryAmount: number
  payPercent: number
  lastLoginAt: Date | null
  /// Hisob ochilgan vaqt — oylik shu oydan boshlab hisoblanadi (payroll)
  createdAt: Date
}

/// Xodimning ish haqi sharti. Boshqa modullar uchun (visits — tashrifga
/// foizni yozadi, payroll — oylikni qoʻshadi). Topilmasa nol — begona
/// klinika xodimi ijarachi kengaytmasi ostida topilmaydi
export async function payTermsTx(
  tx: ClinicTx,
  userId: string,
): Promise<{ salaryAmount: number; payPercent: number }> {
  const row = await repo.findStaff(tx, userId)
  return { salaryAmount: row?.salaryAmount ?? 0, payPercent: row?.payPercent ?? 0 }
}

/// Boshqa modullar uchun (lab): xodim ismlari. Ochiq tranzaksiya ichida
export async function staffNamesTx(tx: ClinicTx, ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const rows = await repo.findStaffByIds(tx, ids)
  return new Map(rows.map((row) => [row.id, row.fullName ?? '']))
}

/// Xodimning ismi. Boshqa modullar uchun (payroll — xarajat izohiga).
/// Yoʻq boʻlsa null — begona klinika xodimi ham shu
export async function findStaffNameTx(tx: ClinicTx, userId: string): Promise<string | null> {
  const row = await repo.findStaff(tx, userId)
  return row ? (row.fullName ?? '') : null
}

/// Xodim shu klinikada bormi — naryadga texnik tayinlashda tekshiriladi
export async function existsInClinic(tx: ClinicTx, userId: string): Promise<boolean> {
  return (await repo.findStaff(tx, userId)) !== null
}

/// Qabul qiluvchi shifokorlar: roli `visits.write` ni beradigan faol
/// xodimlar. Rol nomiga qaramaymiz — klinika shablonni oʻzgartirgan
/// boʻlishi mumkin. Ochiq navbat sahifasi shu roʻyxatni koʻrsatadi
/// Rol nomi ham qaytadi (14.6): jadval sarlavhasidagi shifokor kartasi uni
/// koʻrsatadi. Ism kabi sir emas — pochta va ish haqi `staff.manage` da qoladi
export async function listDoctorsTx(
  tx: ClinicTx,
): Promise<{ id: string; fullName: string; roleName: string | null }[]> {
  const roles = await clinics.listRolesTx(tx)
  const treating = new Map(
    roles
      .filter((role) => role.permissions.includes('visits.write'))
      .map((role) => [role.id, role] as const),
  )
  if (treating.size === 0) return []

  const people = await repo.listStaff(tx)
  return people
    .filter((person) => person.status === 'active' && person.roleId && treating.has(person.roleId))
    .map((person) => {
      const role = person.roleId ? treating.get(person.roleId) : undefined
      return {
        id: person.id,
        fullName: person.fullName ?? '',
        roleName: role ? roleLabel(role) : null,
      }
    })
}

/// Tashrif formasidagi «Shifokor» tanlovi uchun
export function listDoctors(deps: AuthDeps, clinicId: string) {
  return withClinic(deps.db, clinicId, (tx) => listDoctorsTx(tx))
}

/// Boshqa modullar uchun (visits): shu odam tashrifga shifokor boʻla oladimi —
/// faol va roli `visits.write` beradi. Begona klinika xodimi bu yerda
/// topilmaydi: `listStaff` ijarachi kengaytmasi ostida
export async function isDoctorTx(tx: ClinicTx, userId: string): Promise<boolean> {
  const doctors = await listDoctorsTx(tx)
  return doctors.some((doctor) => doctor.id === userId)
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

/// Boshqa modullar uchun (payroll): xodimlar roʻyxati ish haqi sharti bilan.
/// Ochiq tranzaksiya ichida
export async function listStaffTx(tx: ClinicTx): Promise<StaffMember[]> {
  const [people, roles, links] = await Promise.all([
    repo.listStaff(tx),
    clinics.listRolesTx(tx),
    repo.listAssistantLinks(tx),
  ])
  const roleById = new Map(roles.map((role) => [role.id, role]))
  const doctorsOf = new Map<string, string[]>()
  for (const link of links) {
    doctorsOf.set(link.assistantId, [...(doctorsOf.get(link.assistantId) ?? []), link.doctorId])
  }

  return people.map((person) =>
    toMember(
      person,
      person.roleId ? roleById.get(person.roleId) : undefined,
      doctorsOf.get(person.id) ?? [],
    ),
  )
}

type StaffRow = Awaited<ReturnType<typeof repo.listStaff>>[number]

function toMember(
  person: StaffRow,
  role: { name: string; template: string } | undefined,
  doctorIds: string[],
): StaffMember {
  return {
    id: person.id,
    email: person.email,
    fullName: person.fullName,
    roleId: person.roleId,
    roleName: role?.name ?? null,
    roleTemplate: role?.template ?? null,
    doctorIds,
    status: person.status,
    salaryAmount: person.salaryAmount,
    payPercent: person.payPercent,
    lastLoginAt: person.lastLoginAt,
    createdAt: person.createdAt,
  }
}

const ASSISTANT = 'assistent'

/// Xodim qoidalari (tz.md 20-boʻlim) — yaratish ham, oʻzgartirish ham shu
/// yerdan oʻtadi, shunda ikkala yoʻlda bitta chegara turadi:
///   1. individual kabinetda faqat assistent va faol assistentlar chegarasi
///   2. assistent kamida bitta shifokorga biriktiriladi, shifokor shu
///      klinikaniki va faol (`listDoctorsTx` — ijarachi qatlami ostida)
/// Qaytadi: assistentning yangi shifokorlari; `null` — bogʻlanishga tegilmaydi
async function checkStaffRules(
  tx: ClinicTx,
  clinicId: string,
  next: {
    targetId: string | null
    template: string
    /// Oldin ham assistent edi — shifokor tanlovi qayta soʻralmaydi
    wasAssistant: boolean
    wasActiveAssistant: boolean
    willBeActive: boolean
    doctorIds: string[] | undefined
  },
): Promise<string[] | null> {
  const clinic = await clinics.findClinic(tx, clinicId)
  const solo = clinic?.kind === 'solo'
  const isAssistant = next.template === ASSISTANT

  if (solo && !isAssistant && next.targetId === null) {
    throw errors.upgradeRequired(STAFF_TEXT.solo_only_assistant)
  }
  if (solo && isAssistant && next.willBeActive && !next.wasActiveAssistant) {
    if ((await countActiveAssistants(tx)) >= SOLO_MAX_ASSISTANTS) {
      throw errors.upgradeRequired(STAFF_TEXT.solo_assistant_limit(SOLO_MAX_ASSISTANTS))
    }
  }

  if (!isAssistant) return []

  const doctors = (await listDoctorsTx(tx)).map((doctor) => doctor.id)
  // Individualda shifokor bitta — egasi. Tanlov soʻralmaydi
  if (solo) return doctors
  if (next.doctorIds === undefined) {
    // Assistent boʻlib qolyapti (oylik yoki holat oʻzgardi) — bogʻlanishlar joyida
    if (next.wasAssistant) return null
    throw errors.validation({ doctorIds: STAFF_TEXT.doctors_required })
  }
  const unique = [...new Set(next.doctorIds)]
  if (unique.length === 0) throw errors.validation({ doctorIds: STAFF_TEXT.doctors_required })
  if (unique.some((id) => !doctors.includes(id))) {
    throw errors.validation({ doctorIds: STAFF_TEXT.doctor_not_found })
  }
  return unique
}

/// Panel: klinikani individualga oʻtkazishdan oldin (tz.md 20-boʻlim).
/// Faqat egasi va assistentlar qolgan boʻlishi shart — aks holda boshqa
/// rollardagi xodimlar individual cheklovlari ostida «osilib» qolardi.
/// Assistentlar shifokorga — individualda u egasining oʻzi — qayta biriktiriladi
export async function prepareSoloTx(tx: ClinicTx): Promise<void> {
  const active = (await listStaffTx(tx)).filter((person) => person.status === 'active')
  const extra = active.filter(
    (person) => person.roleTemplate !== 'egasi' && person.roleTemplate !== ASSISTANT,
  )
  if (extra.length > 0) {
    const names = extra.map((person) => person.fullName ?? person.email).join(', ')
    throw errors.conflict(STAFF_TEXT.solo_extra_staff(names))
  }
  const assistants = active.filter((person) => person.roleTemplate === ASSISTANT)
  if (assistants.length > SOLO_MAX_ASSISTANTS) {
    throw errors.conflict(STAFF_TEXT.solo_assistant_limit(SOLO_MAX_ASSISTANTS))
  }
  const doctors = (await listDoctorsTx(tx)).map((doctor) => doctor.id)
  for (const assistant of assistants) {
    await repo.setAssistantDoctors(tx, assistant.id, doctors)
  }
}

async function countActiveAssistants(tx: ClinicTx): Promise<number> {
  const roles = await clinics.listRolesTx(tx)
  const ids = roles.filter((role) => role.template === ASSISTANT).map((role) => role.id)
  return ids.length === 0 ? 0 : repo.countActiveByRoles(tx, ids)
}

export function listStaff(deps: AuthDeps, clinicId: string): Promise<StaffMember[]> {
  return withClinic(deps.db, clinicId, (tx) => listStaffTx(tx))
}

/// Xodim hisobini egasi ochadi: parolni u belgilaydi va xodimga aytadi.
///
/// Pochta tasdiqlash oqimi bu yerda yoʻq — hisobni klinikaning oʻzi
/// yaratyapti, yaʼni pochta egaligini isbotlash kerak emas
export function createStaff(
  deps: AuthDeps,
  clinicId: string,
  userId: string,
  input: StaffCreateInput,
): Promise<StaffMember> {
  const id = uuidV7()

  return withClinic(deps.db, clinicId, async (tx) => {
    const role = await clinics.findRoleByIdTx(tx, input.roleId)
    if (!role) throw errors.notFound(STAFF_TEXT.role_not_found)

    const doctorIds = await checkStaffRules(tx, clinicId, {
      targetId: null,
      template: role.template,
      wasAssistant: false,
      wasActiveAssistant: false,
      willBeActive: true,
      doctorIds: input.doctorIds,
    })

    const passwordHash = await hashPassword(input.password)

    let created: Awaited<ReturnType<typeof repo.createStaff>>
    try {
      created = await repo.createStaff(tx, {
        userId: id,
        roleId: input.roleId,
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        salaryAmount: input.salaryAmount,
        payPercent: input.payPercent,
      })
    } catch (error) {
      // users.email butun bazada yagona: hisob boshqa kabinetda boʻlishi
      // mumkin — xato pochta maydoni ostida chiqadi
      if (isDuplicateEmail(error)) throw errors.validation({ email: STAFF_TEXT.email_taken })
      throw error
    }
    if (doctorIds?.length) await repo.setAssistantDoctors(tx, id, doctorIds)

    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.staff_changed,
      entity: 'user',
      entityId: id,
      meta: { created: true },
    })

    return toMember(created, role, doctorIds ?? [])
  })
}

/// Xodim oʻz parolini almashtiradi. Joriy parol soʻraladi: oʻgirlangan
/// ochiq sessiya bilan parolni almashtirib qoʻyish mumkin boʻlmasin
export function changePassword(
  deps: AuthDeps,
  clinicId: string,
  userId: string,
  input: PasswordChangeInput,
): Promise<void> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const current = await repo.passwordOf(tx, userId)
    if (!current) throw errors.unauthorized()

    if (!(await verifyPassword(current, input.currentPassword))) {
      throw errors.badRequest(STAFF_TEXT.password_wrong)
    }
    if (await verifyPassword(current, input.newPassword)) {
      throw errors.badRequest(STAFF_TEXT.password_same)
    }

    await repo.setPassword(tx, userId, await hashPassword(input.newPassword))
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.staff_changed,
      entity: 'user',
      entityId: userId,
      meta: { password: true },
    })
  })
}

/// Rol, holat yoki ish haqi shartini oʻzgartirish. Uchta himoya (tz.md 6-boʻlim):
///   1. oʻz rolini va holatini oʻzgartira olmaydi (ish haqi shartini — mumkin:
///      egasi oʻzi ham shifokor boʻlib foizga ishlashi mumkin)
///   2. oxirgi faol egasi qolishi shart
///   3. rol shu klinikaniki boʻlishi kerak — buni ijarachi qatlami ushlaydi
export function updateStaff(
  deps: AuthDeps,
  clinicId: string,
  actorId: string,
  targetId: string,
  input: StaffUpdateInput,
) {
  const touchesAccess =
    input.roleId !== undefined || input.status !== undefined || input.doctorIds !== undefined
  if (actorId === targetId && touchesAccess) throw errors.badRequest(STAFF_TEXT.self_change)

  return withClinic(deps.db, clinicId, async (tx) => {
    const target = await repo.findStaff(tx, targetId)
    if (!target) throw errors.notFound(STAFF_TEXT.not_found)

    const roles = await clinics.listRolesTx(tx)
    const ownerRoleIds = roles.filter((role) => role.isOwner).map((role) => role.id)

    if (input.roleId && !roles.some((role) => role.id === input.roleId)) {
      throw errors.notFound(STAFF_TEXT.role_not_found)
    }

    const templateOf = (roleId: string | null) =>
      roles.find((role) => role.id === roleId)?.template ?? ''
    const currentTemplate = templateOf(target.roleId)
    const nextTemplate = input.roleId ? templateOf(input.roleId) : currentTemplate
    const clinic = await clinics.findClinic(tx, clinicId)
    // Individualda rolni faqat assistentga almashtirish mumkin
    if (clinic?.kind === 'solo' && input.roleId && nextTemplate !== ASSISTANT) {
      throw errors.upgradeRequired(STAFF_TEXT.solo_only_assistant)
    }
    const doctorIds = await checkStaffRules(tx, clinicId, {
      targetId,
      template: nextTemplate,
      wasAssistant: currentTemplate === ASSISTANT,
      wasActiveAssistant: currentTemplate === ASSISTANT && target.status === 'active',
      willBeActive: input.status ? input.status === 'active' : target.status === 'active',
      doctorIds: input.doctorIds,
    })

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
      ...(input.salaryAmount === undefined ? {} : { salaryAmount: input.salaryAmount }),
      ...(input.payPercent === undefined ? {} : { payPercent: input.payPercent }),
    })
    if (doctorIds !== null) await repo.setAssistantDoctors(tx, targetId, doctorIds)
    await writeAudit(tx, {
      userId: actorId,
      action: input.roleId ? AUDIT_ACTION.role_changed : AUDIT_ACTION.staff_changed,
      entity: 'user',
      entityId: targetId,
      meta: { ...input },
    })
    const role = roles.find((item) => item.id === updated.roleId)
    return toMember(updated, role, doctorIds ?? (await repo.doctorIdsOf(tx, targetId)))
  })
}
