// Boshqaruv paneli. Faqat platforma admini uchun.
//
// Admin hech qaysi klinikaga tegishli emas, shuning uchun bu modul
// `withClinic` ishlatmaydi — u ijarachi chegarasidan tashqarida turadi.
// Aynan shu sababli har bir marshrut `requirePlatformAdmin` bilan
// yopiladi va bu yerga faqat klinikalar roʻyxati kabi umumiy maʼlumot
// chiqadi (bemor maʼlumoti hech qachon).

import { AUTH_TEXT, addDays, todayISO } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import type { Mailer } from '../../platform/mailer.js'
import { withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as auth from '../auth/service.js'
import * as clinics from '../clinics/service.js'
import * as repo from './repo.js'
import type {
  ClinicCreateInput,
  ClinicListInput,
  EventsInput,
  ExtendInput,
  StatusInput,
} from './schema.js'

export interface AdminDeps {
  db: Db
  /// Taklifnoma xati shu yerdan ketadi
  mailer: Mailer
  cabinetUrl: string
}

export interface AdminUser {
  id: string
  email: string
  fullName: string | null
}

interface AdminRow {
  id: string
  email: string
  full_name: string | null
}

export async function currentAdmin(deps: AdminDeps, userId: string): Promise<AdminUser> {
  // RLS `users` ni yopib turadi va admin qatorida `clinic_id` boʻsh —
  // u hech qanday klinika siyosatiga tushmaydi, yaʼni ilova ulanishiga
  // umuman koʻrinmaydi. Shuning uchun tor SECURITY DEFINER funksiya
  const rows = await deps.db.$queryRaw<AdminRow[]>`SELECT * FROM admin_find(${userId}::uuid)`

  const admin = rows[0]
  if (!admin) throw errors.unauthorized()
  return { id: admin.id, email: admin.email, fullName: admin.full_name }
}

// ─────────────────────────  Klinikalar  ─────────────────────────

const HISTORY_LIMIT = 30

export interface ClinicSummary {
  id: string
  name: string
  phone: string | null
  plan: string
  isTrial: boolean
  expiresAt: string
  status: 'active' | 'blocked'
  createdAt: string
  staffCount: number
  lastLoginAt: string | null
  /// Muddat tugagan — panelda alohida belgi bilan koʻrsatiladi
  expired: boolean
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toSummary(row: repo.ClinicRow): ClinicSummary {
  const expiresAt = toIso(row.expires_at)
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    plan: row.plan,
    isTrial: row.is_trial,
    expiresAt,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    staffCount: Number(row.staff_count),
    lastLoginAt: row.last_login_at?.toISOString() ?? null,
    expired: expiresAt < todayISO(),
  }
}

export async function listClinics(
  deps: AdminDeps,
  input: ClinicListInput,
): Promise<ClinicSummary[]> {
  const rows = await repo.listClinics(deps.db, input.search)
  return rows.map(toSummary)
}

export interface ClinicCard extends ClinicSummary {
  queueEnabled: boolean
  patientCount: number
  visitCount: number
  staff: {
    id: string
    email: string
    fullName: string | null
    roleName: string | null
    status: 'active' | 'disabled'
    lastLoginAt: string | null
  }[]
  history: { at: string; action: string; actor: string | null }[]
  /// Qabul qilinmagan taklifnoma. Boʻlsa — klinika hali hech kim
  /// kirmagan, panelda «Taklif yuborilgan» deb koʻrsatiladi
  pendingInvite: { email: string; sentAt: string; expiresAt: string } | null
}

export async function clinicCard(deps: AdminDeps, clinicId: string): Promise<ClinicCard> {
  const clinic = await repo.findClinic(deps.db, clinicId)
  if (!clinic) throw errors.notFound()

  const [staff, history, invite] = await Promise.all([
    repo.listStaff(deps.db, clinicId),
    repo.listHistory(deps.db, clinicId, HISTORY_LIMIT),
    // Taklifnoma auth moduliniki — uning xizmati orqali oʻqiladi
    withClinic(deps.db, clinicId, (tx) => auth.pendingInvite(tx)),
  ])

  return {
    ...toSummary(clinic),
    queueEnabled: clinic.queue_enabled,
    patientCount: Number(clinic.patient_count),
    visitCount: Number(clinic.visit_count),
    staff: staff.map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      roleName: row.role_name,
      status: row.status,
      lastLoginAt: row.last_login_at?.toISOString() ?? null,
    })),
    history: history.map((row) => ({
      at: row.at.toISOString(),
      action: row.action,
      actor: row.actor,
    })),
    pendingInvite: invite
      ? {
          email: invite.email,
          sentAt: invite.createdAt.toISOString(),
          expiresAt: invite.expiresAt.toISOString(),
        }
      : null,
  }
}

/// Panelidan klinika ochish.
///
/// Parol bu yerda umuman yaratilmaydi: egasiga havola ketadi va parolni
/// oʻzi qoʻyadi. Shu sababli admin uni na koʻradi, na tanlaydi — keyin
/// «parolni kim bilardi» degan savol chiqmaydi.
export async function createClinic(
  deps: AdminDeps,
  adminId: string,
  input: ClinicCreateInput,
): Promise<ClinicCard> {
  // Band pochtani oldindan tekshiramiz: aks holda klinika yaratilib,
  // qabul qilish bosqichida yiqilardi va boʻsh klinika qolib ketardi
  if (await auth.emailTaken(deps.db, input.email)) {
    throw errors.conflict(AUTH_TEXT.email_taken)
  }

  // Klinika id si kodda: RLS yozuvni kiritishdan oldin sessiyada oʻsha
  // id turishini talab qiladi (auth/service.ts dagi register bilan bir xil)
  const clinicId = uuidV7()
  const expiresAt = addDays(input.trialDays)

  const { token } = await withClinic(deps.db, clinicId, async (tx) => {
    const { ownerRoleId } = await clinics.createClinicWithRoles(tx, {
      clinicId,
      name: input.name,
      phone: input.phone ?? null,
      expiresAt,
    })
    const invite = await auth.createInvite(tx, { roleId: ownerRoleId, email: input.email })

    await writeAudit(tx, {
      userId: adminId,
      action: AUDIT_ACTION.clinic_created,
      entity: 'clinic',
      entityId: clinicId,
      meta: { email: input.email, trialDays: input.trialDays },
    })
    await writeAudit(tx, {
      userId: adminId,
      action: AUDIT_ACTION.invite_sent,
      entity: 'clinic',
      entityId: clinicId,
      meta: { email: input.email },
    })

    return invite
  })

  await auth.sendInviteMail(
    { mailer: deps.mailer, cabinetUrl: deps.cabinetUrl },
    { email: input.email, clinicName: input.name, token },
  )

  return clinicCard(deps, clinicId)
}

/// Xat yoʻqolsa yoki muddati oʻtsa — yangi havola. Eskisi ishlamay qoladi
export async function resendInvite(
  deps: AdminDeps,
  adminId: string,
  clinicId: string,
): Promise<ClinicCard> {
  const clinic = await repo.findClinic(deps.db, clinicId)
  if (!clinic) throw errors.notFound()

  const sent = await withClinic(deps.db, clinicId, async (tx) => {
    const pending = await auth.pendingInvite(tx)
    if (!pending) return null

    const invite = await auth.createInvite(tx, {
      roleId: pending.roleId,
      email: pending.email,
    })
    await writeAudit(tx, {
      userId: adminId,
      action: AUDIT_ACTION.invite_sent,
      entity: 'clinic',
      entityId: clinicId,
      meta: { email: pending.email, resent: true },
    })
    return { token: invite.token, email: pending.email }
  })

  if (!sent) throw errors.notFound()

  await auth.sendInviteMail(
    { mailer: deps.mailer, cabinetUrl: deps.cabinetUrl },
    { email: sent.email, clinicName: clinic.name, token: sent.token },
  )

  return clinicCard(deps, clinicId)
}

/// Muddatni uzaytirish. Toʻlov hozircha qoʻlda: mijoz Telegram orqali
/// yozadi, admin shu tugmani bosadi (tz.md 8-boʻlim)
export async function extendClinic(
  deps: AdminDeps,
  adminId: string,
  clinicId: string,
  input: ExtendInput,
): Promise<ClinicCard> {
  const updated = await repo.extendClinic(deps.db, clinicId, input.days)
  if (!updated) throw errors.notFound()

  // Amal klinikaning oʻz tarixida qoladi — egasi ham koʻra oladi
  await withClinic(deps.db, clinicId, (tx) =>
    writeAudit(tx, {
      userId: adminId,
      action: AUDIT_ACTION.subscription_extended,
      entity: 'clinic',
      entityId: clinicId,
      meta: { days: input.days, until: toIso(updated.expires_at) },
    }),
  )

  return clinicCard(deps, clinicId)
}

export async function setClinicStatus(
  deps: AdminDeps,
  adminId: string,
  clinicId: string,
  input: StatusInput,
): Promise<ClinicCard> {
  const updated = await repo.setStatus(deps.db, clinicId, input.status)
  if (!updated) throw errors.notFound()

  await withClinic(deps.db, clinicId, (tx) =>
    writeAudit(tx, {
      userId: adminId,
      action:
        input.status === 'blocked' ? AUDIT_ACTION.clinic_blocked : AUDIT_ACTION.clinic_unblocked,
      entity: 'clinic',
      entityId: clinicId,
    }),
  )

  return clinicCard(deps, clinicId)
}

// ─────────────────────────  Statistika va hodisalar  ─────────────────────────

/// Grafik uchun oylar soni
const MONTHS_SHOWN = 12

export interface Stats {
  total: number
  active: number
  trial: number
  expired: number
  blocked: number
  staff: number
  /// Oylar kesimi: roʻyxatdan oʻtganlar va uzaytirishlar.
  /// Daromad summasi yoʻq — narx modeli hali belgilanmagan
  months: { month: string; registered: number; extended: number }[]
}

export async function stats(deps: AdminDeps): Promise<Stats> {
  const [counts, months] = await Promise.all([
    repo.stats(deps.db),
    repo.monthly(deps.db, MONTHS_SHOWN),
  ])

  return {
    total: Number(counts.total),
    active: Number(counts.active),
    trial: Number(counts.trial),
    expired: Number(counts.expired),
    blocked: Number(counts.blocked),
    staff: Number(counts.staff),
    months: months.map((row) => ({
      month: row.month,
      registered: Number(row.registered),
      extended: Number(row.extended),
    })),
  }
}

export interface PlatformEvent {
  at: string
  action: string
  clinicName: string
  actor: string | null
}

export async function events(deps: AdminDeps, input: EventsInput): Promise<PlatformEvent[]> {
  const rows = await repo.events(deps.db, input.limit, !input.all)
  return rows.map((row) => ({
    at: row.at.toISOString(),
    action: row.action,
    clinicName: row.clinic_name,
    actor: row.actor,
  }))
}
