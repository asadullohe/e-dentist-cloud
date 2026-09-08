// Boshqaruv paneli. Faqat platforma admini uchun.
//
// Admin hech qaysi klinikaga tegishli emas, shuning uchun bu modul
// `withClinic` ishlatmaydi — u ijarachi chegarasidan tashqarida turadi.
// Aynan shu sababli har bir marshrut `requirePlatformAdmin` bilan
// yopiladi va bu yerga faqat klinikalar roʻyxati kabi umumiy maʼlumot
// chiqadi (bemor maʼlumoti hech qachon).

import { todayISO } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { withClinic } from '../../platform/tenant.js'
import * as repo from './repo.js'
import type { ClinicListInput, ExtendInput, StatusInput } from './schema.js'

export interface AdminDeps {
  db: Db
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
}

export async function clinicCard(deps: AdminDeps, clinicId: string): Promise<ClinicCard> {
  const clinic = await repo.findClinic(deps.db, clinicId)
  if (!clinic) throw errors.notFound()

  const [staff, history] = await Promise.all([
    repo.listStaff(deps.db, clinicId),
    repo.listHistory(deps.db, clinicId, HISTORY_LIMIT),
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
  }
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
