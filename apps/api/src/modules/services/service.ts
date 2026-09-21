// Xizmatlar katalogi: tur (Jarrohlik, Terapiya…) → xizmat (nom + narx).
// Tashrif yozishda narx shu yerdan tanlanadi.

import { SERVICE_TEXT } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as repo from './repo.js'
import type {
  OrderInput,
  ServiceCreateInput,
  ServiceTypeInput,
  ServiceUpdateInput,
} from './schema.js'

export type { ServiceRow } from './repo.js'

export interface ServiceDeps {
  db: Db
}

function code(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined
}

function audit(tx: ClinicTx, userId: string, entity: 'service' | 'service_type', entityId: string) {
  return writeAudit(tx, { userId, action: AUDIT_ACTION.service_changed, entity, entityId })
}

/// Tartib roʻyxati aynan mavjud idlarni — na kam, na ortiqcha — qamrashi kerak:
/// tushib qolgani tartibsiz qolardi, begonasi RLS tufayli topilmasdi
function assertSameSet(given: readonly string[], existing: readonly string[]) {
  const set = new Set(existing)
  if (
    given.length !== set.size ||
    given.some((id) => !set.has(id)) ||
    new Set(given).size !== given.length
  )
    throw errors.validation({ ids: SERVICE_TEXT.order_invalid })
}

// ── Turlar ──

export function listTypes(deps: ServiceDeps, clinicId: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const rows = await repo.listTypes(tx)
    return rows.map(({ _count, ...row }) => ({ ...row, serviceCount: _count.services }))
  })
}

export function createType(
  deps: ServiceDeps,
  clinicId: string,
  userId: string,
  input: ServiceTypeInput,
) {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      const created = await repo.createType(tx, id, input.name)
      await audit(tx, userId, 'service_type', id)
      return created
    } catch (error) {
      if (code(error) === 'P2002') throw errors.conflict(SERVICE_TEXT.type_name_taken)
      throw error
    }
  })
}

export function updateType(
  deps: ServiceDeps,
  clinicId: string,
  userId: string,
  id: string,
  input: ServiceTypeInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      const updated = await repo.updateType(tx, id, { name: input.name })
      await audit(tx, userId, 'service_type', id)
      return updated
    } catch (error) {
      if (code(error) === 'P2025') throw errors.notFound(SERVICE_TEXT.type_not_found)
      if (code(error) === 'P2002') throw errors.conflict(SERVICE_TEXT.type_name_taken)
      throw error
    }
  })
}

/// Ichida xizmati bor tur oʻchirilmaydi — avval koʻchiriladi (409)
export function removeType(deps: ServiceDeps, clinicId: string, userId: string, id: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    if (!(await repo.findType(tx, id))) throw errors.notFound(SERVICE_TEXT.type_not_found)
    const count = await repo.countServicesOfType(tx, id)
    if (count > 0) throw errors.conflict(SERVICE_TEXT.type_has_services(count))
    await repo.removeType(tx, id)
    await audit(tx, userId, 'service_type', id)
  })
}

export function reorderTypes(
  deps: ServiceDeps,
  clinicId: string,
  userId: string,
  input: OrderInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const existing = (await repo.listTypes(tx)).map((row) => row.id)
    assertSameSet(input.ids, existing)
    await repo.reorderTypes(tx, input.ids)
    await audit(tx, userId, 'service_type', clinicId)
  })
}

// ── Xizmatlar ──

/// Boshqa modullar uchun: roʻyxat ochiq tranzaksiya ichida (Excel)
export function listTx(tx: ClinicTx) {
  return repo.list(tx)
}

export function list(deps: ServiceDeps, clinicId: string) {
  return withClinic(deps.db, clinicId, (tx) => repo.list(tx))
}

async function assertType(tx: ClinicTx, typeId: string) {
  if (!(await repo.findType(tx, typeId)))
    throw errors.validation({ typeId: SERVICE_TEXT.type_not_found })
}

export function create(
  deps: ServiceDeps,
  clinicId: string,
  userId: string,
  input: ServiceCreateInput,
) {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertType(tx, input.typeId)
    try {
      const created = await repo.create(tx, id, {
        typeId: input.typeId,
        name: input.name,
        price: input.price,
        techPrice: input.techPrice ?? null,
      })
      await audit(tx, userId, 'service', id)
      return created
    } catch (error) {
      // Tur ichida nom takrorlanmaydi
      if (code(error) === 'P2002') throw errors.conflict(SERVICE_TEXT.name_taken)
      throw error
    }
  })
}

export function update(
  deps: ServiceDeps,
  clinicId: string,
  userId: string,
  id: string,
  input: ServiceUpdateInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    if (input.typeId !== undefined) await assertType(tx, input.typeId)
    try {
      const updated = await repo.update(tx, id, {
        ...(input.typeId === undefined ? {} : { typeId: input.typeId }),
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.price === undefined ? {} : { price: input.price }),
        ...(input.techPrice === undefined ? {} : { techPrice: input.techPrice }),
      })
      await audit(tx, userId, 'service', id)
      return updated
    } catch (error) {
      if (code(error) === 'P2025') throw errors.notFound(SERVICE_TEXT.not_found)
      if (code(error) === 'P2002') throw errors.conflict(SERVICE_TEXT.name_taken)
      throw error
    }
  })
}

export function remove(deps: ServiceDeps, clinicId: string, userId: string, id: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      await repo.remove(tx, id)
    } catch (error) {
      if (code(error) === 'P2025') throw errors.notFound(SERVICE_TEXT.not_found)
      throw error
    }
    await audit(tx, userId, 'service', id)
  })
}

/// Bitta tur ichidagi xizmatlar tartibi
export function reorderServices(
  deps: ServiceDeps,
  clinicId: string,
  userId: string,
  typeId: string,
  input: OrderInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    if (!(await repo.findType(tx, typeId))) throw errors.notFound(SERVICE_TEXT.type_not_found)
    const existing = (await repo.idsOfType(tx, typeId)).map((row) => row.id)
    assertSameSet(input.ids, existing)
    await repo.reorderServices(tx, input.ids)
    await audit(tx, userId, 'service_type', typeId)
  })
}
