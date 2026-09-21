// `time_blocks` jadvali — schedule modulniki (shifokorning band vaqti)

import type { Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const SELECT = {
  id: true,
  doctorId: true,
  startsAt: true,
  endsAt: true,
  reason: true,
} satisfies Prisma.TimeBlockSelect

export type TimeBlockRow = Prisma.TimeBlockGetPayload<{ select: typeof SELECT }>

/// Oraliq bilan kesishganlar: boshlanishi oraliqdan oldin, tugashi keyin
export function list(tx: ClinicTx, from: Date, to: Date, doctorId?: string) {
  return tx.timeBlock.findMany({
    where: { startsAt: { lt: to }, endsAt: { gt: from }, ...(doctorId ? { doctorId } : {}) },
    select: SELECT,
    orderBy: { startsAt: 'asc' },
  })
}

export function findById(tx: ClinicTx, id: string) {
  return tx.timeBlock.findUnique({ where: { id }, select: SELECT })
}

export function create(
  tx: ClinicTx,
  id: string,
  data: {
    doctorId: string
    startsAt: Date
    endsAt: Date
    reason: string | null
    createdBy: string
  },
) {
  return tx.timeBlock.create({ data: tenantScoped({ id, ...data }), select: SELECT })
}

export function update(
  tx: ClinicTx,
  id: string,
  data: { doctorId: string; startsAt: Date; endsAt: Date; reason: string | null },
) {
  return tx.timeBlock.update({ where: { id }, data, select: SELECT })
}

export function remove(tx: ClinicTx, id: string) {
  return tx.timeBlock.delete({ where: { id } })
}
