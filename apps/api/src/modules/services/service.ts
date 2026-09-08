// Narxnoma. Tashrif yozishda narx shu yerdan tanlanadi.

import { SERVICE_TEXT } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as repo from './repo.js'
import type { ServiceCreateInput, ServiceUpdateInput } from './schema.js'

export interface ServiceDeps {
  db: Db
}

function code(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined
}

/// Boshqa modullar uchun: narx roʻyxati ochiq tranzaksiya ichida
export function listTx(tx: ClinicTx) {
  return repo.list(tx)
}

export function list(deps: ServiceDeps, clinicId: string) {
  return withClinic(deps.db, clinicId, (tx) => repo.list(tx))
}

export function create(
  deps: ServiceDeps,
  clinicId: string,
  userId: string,
  input: ServiceCreateInput,
) {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      const created = await repo.create(tx, id, { name: input.name, price: input.price })
      await writeAudit(tx, {
        userId,
        action: AUDIT_ACTION.service_changed,
        entity: 'service',
        entityId: id,
      })
      return created
    } catch (error) {
      // Klinika ichida nom takrorlanmaydi
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
    try {
      const updated = await repo.update(tx, id, {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.price === undefined ? {} : { price: input.price }),
      })
      await writeAudit(tx, {
        userId,
        action: AUDIT_ACTION.service_changed,
        entity: 'service',
        entityId: id,
      })
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
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.service_changed,
      entity: 'service',
      entityId: id,
    })
  })
}
