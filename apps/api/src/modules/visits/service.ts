// Tashriflar va tish xaritasi mantigʻi.

import { PATIENT_TEXT, VISIT_TEXT } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as patients from '../patients/service.js'
import * as repo from './repo.js'
import type { ToothUpdateInput, VisitCreateInput, VisitUpdateInput } from './schema.js'

export interface VisitDeps {
  db: Db
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025'
  )
}

/// Bemor shu klinikaniki ekanini tasdiqlaydi. Tashqi kalit tekshiruvi RLS ni
/// chetlab oʻtadi, shuning uchun bu tekshiruvsiz begona bemorga yozuv
/// bogʻlab qoʻyish mumkin boʻlardi
async function assertPatient(tx: ClinicTx, patientId: string): Promise<void> {
  if (!(await patients.existsInClinic(tx, patientId))) {
    throw errors.notFound(PATIENT_TEXT.not_found)
  }
}

export function listVisits(deps: VisitDeps, clinicId: string, patientId: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, patientId)
    return repo.listVisits(tx, patientId)
  })
}

export function createVisit(
  deps: VisitDeps,
  clinicId: string,
  userId: string,
  input: VisitCreateInput,
) {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, input.patientId)

    const visit = await repo.createVisit(tx, id, {
      patientId: input.patientId,
      date: toDate(input.date),
      treatment: input.treatment,
      tooth: input.tooth ?? null,
      serviceId: input.serviceId ?? null,
      price: input.price,
      note: input.note ?? null,
    })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.visit_created,
      entity: 'visit',
      entityId: id,
      meta: { patientId: input.patientId },
    })
    return visit
  })
}

export function updateVisit(
  deps: VisitDeps,
  clinicId: string,
  userId: string,
  id: string,
  input: VisitUpdateInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      const visit = await repo.updateVisit(tx, id, {
        ...(input.date === undefined ? {} : { date: toDate(input.date) }),
        ...(input.treatment === undefined ? {} : { treatment: input.treatment }),
        ...(input.tooth === undefined ? {} : { tooth: input.tooth }),
        ...(input.price === undefined ? {} : { price: input.price }),
        ...(input.note === undefined ? {} : { note: input.note }),
      })
      await writeAudit(tx, {
        userId,
        action: AUDIT_ACTION.visit_updated,
        entity: 'visit',
        entityId: id,
      })
      return visit
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(VISIT_TEXT.not_found)
      throw error
    }
  })
}

export function removeVisit(deps: VisitDeps, clinicId: string, userId: string, id: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      await repo.removeVisit(tx, id)
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(VISIT_TEXT.not_found)
      throw error
    }
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.visit_deleted,
      entity: 'visit',
      entityId: id,
    })
  })
}

export function chart(deps: VisitDeps, clinicId: string, patientId: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, patientId)
    return repo.chart(tx, patientId)
  })
}

/// Butun xaritani qaytaradi: mijoz bitta tishni emas, tayyor holatni oladi
export function setTooth(
  deps: VisitDeps,
  clinicId: string,
  userId: string,
  patientId: string,
  tooth: number,
  input: ToothUpdateInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, patientId)

    const material = input.material ?? ''
    const note = input.note ?? null
    // «Sogʻlom», izohsiz va materialsiz — sukut holati, qator saqlanmaydi
    if (input.status === 'soglom' && !note && !material) {
      await repo.clearTooth(tx, patientId, tooth)
    } else {
      await repo.setTooth(tx, uuidV7(), patientId, tooth, { status: input.status, material, note })
    }

    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.tooth_updated,
      entity: 'tooth',
      entityId: `${patientId}:${tooth}`,
      meta: { status: input.status },
    })
    return repo.chart(tx, patientId)
  })
}
