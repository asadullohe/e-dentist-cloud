// services moduli `service_types` va `services` jadvallariga egalik qiladi.

import type { ServiceArea } from '@e-dentist/shared'
import type { Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const TYPE_SELECT = { id: true, name: true, position: true } satisfies Prisma.ServiceTypeSelect
const SELECT = {
  id: true,
  typeId: true,
  name: true,
  price: true,
  techPrice: true,
  area: true,
  position: true,
  type: { select: { name: true } },
} satisfies Prisma.ServiceSelect

type Row = Prisma.ServiceGetPayload<{ select: typeof SELECT }>

/// Tashqariga tekis shakl: `typeName` — tur nomi (roʻyxat va Excel uchun)
export interface ServiceRow {
  id: string
  typeId: string
  typeName: string
  name: string
  price: number
  techPrice: number | null
  /// Nimaga qoʻllaniladi (19-boʻlim)
  area: ServiceArea
  position: number
}

const flat = (row: Row): ServiceRow => ({
  id: row.id,
  typeId: row.typeId,
  typeName: row.type.name,
  name: row.name,
  price: row.price,
  techPrice: row.techPrice,
  area: row.area,
  position: row.position,
})

// ── Turlar ──

export function listTypes(tx: ClinicTx) {
  return tx.serviceType.findMany({
    select: { ...TYPE_SELECT, _count: { select: { services: true } } },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  })
}

export function findType(tx: ClinicTx, id: string) {
  return tx.serviceType.findUnique({ where: { id }, select: TYPE_SELECT })
}

export function countServicesOfType(tx: ClinicTx, typeId: string) {
  return tx.service.count({ where: { typeId } })
}

/// Yangi tur oxiriga qoʻshiladi
export async function createType(tx: ClinicTx, id: string, name: string) {
  const last = await tx.serviceType.aggregate({ _max: { position: true } })
  return tx.serviceType.create({
    data: tenantScoped({ id, name, position: (last._max.position ?? 0) + 1 }),
    select: TYPE_SELECT,
  })
}

export function updateType(tx: ClinicTx, id: string, data: { name: string }) {
  return tx.serviceType.update({ where: { id }, data, select: TYPE_SELECT })
}

export function removeType(tx: ClinicTx, id: string) {
  return tx.serviceType.delete({ where: { id } })
}

/// Tartib: berilgan idlar shu ketma-ketlikda 1, 2, 3…
export async function reorderTypes(tx: ClinicTx, ids: readonly string[]) {
  await Promise.all(
    ids.map((id, index) => tx.serviceType.update({ where: { id }, data: { position: index + 1 } })),
  )
}

// ── Xizmatlar ──

/// Tur tartibi → tur ichidagi tartib → nom
export async function list(tx: ClinicTx): Promise<ServiceRow[]> {
  const rows = await tx.service.findMany({
    select: SELECT,
    orderBy: [{ type: { position: 'asc' } }, { position: 'asc' }, { name: 'asc' }],
  })
  return rows.map(flat)
}

export async function create(
  tx: ClinicTx,
  id: string,
  data: {
    typeId: string
    name: string
    price: number
    techPrice: number | null
    area: ServiceArea
  },
): Promise<ServiceRow> {
  const last = await tx.service.aggregate({
    where: { typeId: data.typeId },
    _max: { position: true },
  })
  const row = await tx.service.create({
    data: tenantScoped({ id, ...data, position: (last._max.position ?? 0) + 1 }),
    select: SELECT,
  })
  return flat(row)
}

export async function update(
  tx: ClinicTx,
  id: string,
  data: {
    typeId?: string
    name?: string
    price?: number
    techPrice?: number | null
    area?: ServiceArea
    position?: number
  },
): Promise<ServiceRow> {
  return flat(await tx.service.update({ where: { id }, data, select: SELECT }))
}

export function remove(tx: ClinicTx, id: string) {
  return tx.service.delete({ where: { id } })
}

export function idsOfType(tx: ClinicTx, typeId: string) {
  return tx.service.findMany({ where: { typeId }, select: { id: true } })
}

export async function reorderServices(tx: ClinicTx, ids: readonly string[]) {
  await Promise.all(
    ids.map((id, index) => tx.service.update({ where: { id }, data: { position: index + 1 } })),
  )
}
