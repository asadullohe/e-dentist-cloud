// services moduli `services` jadvaliga egalik qiladi.

import type { Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const SELECT = { id: true, name: true, price: true } satisfies Prisma.ServiceSelect

export function list(tx: ClinicTx) {
  return tx.service.findMany({ select: SELECT, orderBy: { name: 'asc' } })
}

export function create(tx: ClinicTx, id: string, data: { name: string; price: number }) {
  return tx.service.create({ data: tenantScoped({ id, ...data }), select: SELECT })
}

export function update(tx: ClinicTx, id: string, data: Prisma.ServiceUpdateInput) {
  return tx.service.update({ where: { id }, data, select: SELECT })
}

export function remove(tx: ClinicTx, id: string) {
  return tx.service.delete({ where: { id } })
}
