// Kartoteka mantigʻi. Boshqa modullar patients ga faqat shu fayl orqali
// murojaat qiladi.

import { normalizePhone, PATIENT_TEXT } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as repo from './repo.js'
import type { PatientCreateInput, PatientListInput, PatientUpdateInput } from './schema.js'

export interface PatientDeps {
  db: Db
}

/// `YYYY-MM-DD` → DATE ustuni uchun UTC yarim tuni.
/// Mahalliy yarim tun yozilsa Toshkent UTC+5 boʻlgani uchun kun bir kun
/// orqaga suriladi (shared/format.ts dagi toDbDate bilan bir xil sabab)
function toDate(value: string | undefined): Date | null | undefined {
  if (value === undefined) return undefined
  return value ? new Date(`${value}T00:00:00Z`) : null
}

function fields(input: PatientCreateInput | PatientUpdateInput) {
  return {
    ...(input.fio === undefined ? {} : { fio: input.fio }),
    ...(input.phone === undefined ? {} : { phone: normalizePhone(input.phone) }),
    ...(input.birthDate === undefined ? {} : { birthDate: toDate(input.birthDate) }),
    ...(input.address === undefined ? {} : { address: input.address || null }),
    ...(input.note === undefined ? {} : { note: input.note || null }),
  }
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025'
  )
}

function hasRelatedRecords(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2003'
  )
}

/// Boshqa modullar uchun: bemor shu klinikaniki ekanini tekshirish.
///
/// Tashqi kalit tekshiruvi RLS ni chetlab oʻtadi — usiz begona klinikaning
/// bemoriga tashrif yoki toʻlov bogʻlab qoʻyish mumkin boʻlardi
export function existsInClinic(tx: ClinicTx, patientId: string): Promise<boolean> {
  return repo.exists(tx, patientId)
}

export function list(deps: PatientDeps, clinicId: string, input: PatientListInput) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const { items, total } = await repo.list(tx, input)
    return { items, total, page: input.page, pageSize: input.pageSize }
  })
}

/// Kartochka ochilishi audit'ga yoziladi — tibbiy maʼlumot uchun kim nima
/// koʻrgani ham yozilishi shart (tz.md 12-boʻlim)
export function get(deps: PatientDeps, clinicId: string, userId: string, id: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const patient = await repo.findById(tx, id)
    if (!patient) throw errors.notFound(PATIENT_TEXT.not_found)

    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.patient_viewed,
      entity: 'patient',
      entityId: id,
    })
    return patient
  })
}

export function create(
  deps: PatientDeps,
  clinicId: string,
  userId: string,
  input: PatientCreateInput,
) {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    const patient = await repo.create(tx, id, { ...fields(input), fio: input.fio })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.patient_created,
      entity: 'patient',
      entityId: id,
    })
    return patient
  })
}

export function update(
  deps: PatientDeps,
  clinicId: string,
  userId: string,
  id: string,
  input: PatientUpdateInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      const patient = await repo.update(tx, id, fields(input))
      await writeAudit(tx, {
        userId,
        action: AUDIT_ACTION.patient_updated,
        entity: 'patient',
        entityId: id,
      })
      return patient
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(PATIENT_TEXT.not_found)
      throw error
    }
  })
}

export function remove(deps: PatientDeps, clinicId: string, userId: string, id: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      await repo.remove(tx, id)
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(PATIENT_TEXT.not_found)
      // Tashrif yoki toʻlov bogʻlangan boʻlsa baza oʻchirishga yoʻl bermaydi —
      // tarix yoʻqolib ketmasin
      if (hasRelatedRecords(error)) throw errors.conflict(PATIENT_TEXT.has_records)
      throw error
    }
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.patient_deleted,
      entity: 'patient',
      entityId: id,
    })
  })
}
