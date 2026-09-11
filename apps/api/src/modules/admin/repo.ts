// admin moduli oʻz jadvaliga ega emas. U klinikalar ustidan ishlaydi,
// lekin ijarachi chegarasidan tashqarida — shuning uchun har soʻrov
// migratsiyada belgilangan tor SECURITY DEFINER funksiyasi orqali boradi.
// Panel qaysi ustunlarni koʻrishi shu funksiyalarda qatʼiy belgilangan.

import type { Db } from '../../platform/db.js'

export interface ClinicRow {
  id: string
  name: string
  phone: string | null
  plan: string
  is_trial: boolean
  expires_at: Date
  status: 'active' | 'blocked'
  created_at: Date
  staff_count: bigint
  last_login_at: Date | null
}

/// Roʻyxatda qoʻshimcha belgi: klinika ochilgan, lekin egasi hali
/// taklifnomani qabul qilmagan
export interface ClinicListRow extends ClinicRow {
  pending_invite: boolean
}

export function listClinics(db: Db, search: string) {
  return db.$queryRaw<ClinicListRow[]>`SELECT * FROM admin_clinics(${search})`
}

export interface ClinicCardRow extends ClinicRow {
  queue_enabled: boolean
  patient_count: bigint
  visit_count: bigint
}

export async function findClinic(db: Db, id: string): Promise<ClinicCardRow | null> {
  const rows = await db.$queryRaw<ClinicCardRow[]>`SELECT * FROM admin_clinic(${id}::uuid)`
  return rows[0] ?? null
}

export interface StaffRow {
  id: string
  email: string
  full_name: string | null
  role_name: string | null
  status: 'active' | 'disabled'
  last_login_at: Date | null
}

export function listStaff(db: Db, clinicId: string) {
  return db.$queryRaw<StaffRow[]>`SELECT * FROM admin_clinic_staff(${clinicId}::uuid)`
}

export interface HistoryRow {
  at: Date
  action: string
  actor: string | null
}

export function listHistory(db: Db, clinicId: string, limit: number) {
  return db.$queryRaw<HistoryRow[]>`
    SELECT * FROM admin_clinic_history(${clinicId}::uuid, ${limit})`
}

export async function extendClinic(db: Db, clinicId: string, days: number) {
  const rows = await db.$queryRaw<{ expires_at: Date; is_trial: boolean }[]>`
    SELECT * FROM admin_extend_clinic(${clinicId}::uuid, ${days})`
  return rows[0] ?? null
}

export async function setStatus(db: Db, clinicId: string, status: 'active' | 'blocked') {
  const rows = await db.$queryRaw<{ status: 'active' | 'blocked' }[]>`
    SELECT * FROM admin_set_clinic_status(${clinicId}::uuid, ${status}::"ClinicStatus")`
  return rows[0] ?? null
}

export interface StatsRow {
  total: bigint
  active: bigint
  trial: bigint
  expired: bigint
  blocked: bigint
  staff: bigint
}

export async function stats(db: Db): Promise<StatsRow> {
  const rows = await db.$queryRaw<StatsRow[]>`SELECT * FROM admin_stats()`
  return rows[0] as StatsRow
}

export interface MonthRow {
  month: string
  registered: bigint
  extended: bigint
}

export function monthly(db: Db, months: number) {
  return db.$queryRaw<MonthRow[]>`SELECT * FROM admin_monthly(${months})`
}

export interface EventRow {
  at: Date
  action: string
  clinic_name: string
  actor: string | null
}

export function events(db: Db, limit: number, platformOnly: boolean) {
  return db.$queryRaw<EventRow[]>`SELECT * FROM admin_events(${limit}, ${platformOnly})`
}
