// Tashriflar va tish xaritasi mantigʻi.

import { PATIENT_TEXT, VISIT_TEXT } from '@e-dentist/shared'
import { bridgeSpan } from '@e-dentist/teeth'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as patients from '../patients/service.js'
import * as repo from './repo.js'
import type {
  BridgeCreateInput,
  ToothUpdateInput,
  VisitCreateInput,
  VisitUpdateInput,
} from './schema.js'

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

/// Boshqa modullar uchun (payments): tashriflar summasi.
/// Ochiq tranzaksiya ichida ishlaydi — chaqiruvchi sessiyani oʻzi ochadi
export function chargeTotals(tx: ClinicTx) {
  return repo.chargeTotals(tx)
}

export function chargeTotalOf(tx: ClinicTx, patientId: string) {
  return repo.chargeTotalOf(tx, patientId)
}

/// Boshqa modullar uchun (reports): kun boʻyicha tashrif soni va summasi
export async function dailyTotalsTx(
  tx: ClinicTx,
  from: Date,
  to: Date,
): Promise<{ date: Date; total: number; count: number }[]> {
  const rows = await repo.dailyTotals(tx, from, to)
  return rows.map((row) => ({
    date: row.date,
    total: row._sum.price ?? 0,
    count: row._count._all,
  }))
}

/// Boshqa modullar uchun (reports): oraliqdagi eng qimmat muolajalar
export async function topTreatmentsTx(
  tx: ClinicTx,
  from: Date,
  to: Date,
  take: number,
): Promise<{ treatment: string; count: number; total: number }[]> {
  const rows = await repo.topTreatments(tx, from, to, take)
  return rows.map((row) => ({
    treatment: row.treatment,
    count: row._count._all,
    total: row._sum.price ?? 0,
  }))
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
/// Boshqa modullar uchun (lab): naryad topshirilganda tish holatini yozadi.
/// Ochiq tranzaksiya ichida — chaqiruvchi sessiyani oʻzi ochgan
export async function setToothTx(
  tx: ClinicTx,
  patientId: string,
  tooth: number,
  data: { status: string; material?: string | null },
): Promise<void> {
  await repo.setTooth(tx, uuidV7(), patientId, tooth, {
    status: data.status,
    material: data.material ?? '',
  })
}

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

/// Koʻprikdagi tishning sukut roli: tishi yoʻq joyga quyma tish,
/// qolganiga tayanch koronka
function defaultRole(status: string | undefined): 'koronka' | 'koprik' {
  return status === 'olingan' || status === 'koprik' ? 'koprik' : 'koronka'
}

export function createBridge(
  deps: VisitDeps,
  clinicId: string,
  userId: string,
  patientId: string,
  input: BridgeCreateInput,
) {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, patientId)

    // Ikkala tish bitta jagʻda boʻlishi shart — boʻlmasa oraliq boʻsh qaytadi
    const span = bridgeSpan(input.from, input.to)
    if (span.length < 2) throw errors.badRequest(VISIT_TEXT.bridge_same_arch)

    const { teeth } = await repo.chart(tx, patientId)
    const statusOf = new Map(teeth.map((t) => [t.tooth, t.status]))

    await repo.createBridge(tx, id, patientId, span, input.material)

    // Koʻprikdagi har tish oʻz roliga mos holatga oʻtadi va koʻprik
    // materialini oladi — xarita shuni chizadi
    for (const tooth of span) {
      const role = input.roles[String(tooth)] ?? defaultRole(statusOf.get(tooth))
      await repo.setTooth(tx, uuidV7(), patientId, tooth, {
        status: role,
        material: input.material,
        note: null,
      })
    }

    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.bridge_created,
      entity: 'bridge',
      entityId: id,
      meta: { patientId, teeth: span },
    })
    return repo.chart(tx, patientId)
  })
}

/// Oʻchirilganda tishlar holati qaytariladi: quyma tish oʻrnida tish yoʻq
/// edi — «olib tashlangan» boʻladi; tayanch tish esa «sogʻlom» ga qaytadi
export function removeBridge(deps: VisitDeps, clinicId: string, userId: string, id: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const bridge = await repo.findBridge(tx, id)
    if (!bridge) throw errors.notFound(VISIT_TEXT.bridge_not_found)

    const { teeth } = await repo.chart(tx, bridge.patientId)
    const statusOf = new Map(teeth.map((t) => [t.tooth, t.status]))

    for (const tooth of bridge.teeth) {
      const status = statusOf.get(tooth)
      if (status === 'koprik') {
        await repo.setTooth(tx, uuidV7(), bridge.patientId, tooth, {
          status: 'olingan',
          material: '',
          note: null,
        })
      } else if (status === 'koronka') {
        // «Sogʻlom» sukut holat — qator saqlanmaydi
        await repo.clearTooth(tx, bridge.patientId, tooth)
      }
    }

    await repo.removeBridge(tx, id)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.bridge_deleted,
      entity: 'bridge',
      entityId: id,
      meta: { patientId: bridge.patientId },
    })
    return repo.chart(tx, bridge.patientId)
  })
}

/// Toʻliq eksport uchun (export moduli). Ochiq tranzaksiya ichida
export function exportVisitsTx(tx: ClinicTx) {
  return repo.allVisits(tx)
}

export function exportTeethTx(tx: ClinicTx) {
  return repo.allTeeth(tx)
}

export function exportBridgesTx(tx: ClinicTx) {
  return repo.allBridges(tx)
}
