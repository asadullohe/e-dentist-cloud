// lab moduli `lab_orders` jadvaliga egalik qiladi.

import type {
  LabMaterial,
  LabStatus,
  LabWorkType,
  Prisma,
} from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const SELECT = {
  id: true,
  patientId: true,
  doctorId: true,
  techId: true,
  teeth: true,
  workType: true,
  material: true,
  shade: true,
  dueDate: true,
  techPrice: true,
  status: true,
  note: true,
  returns: true,
  returnReason: true,
  returnNote: true,
  deliveredAt: true,
} satisfies Prisma.LabOrderSelect

export type LabRow = Prisma.LabOrderGetPayload<{ select: typeof SELECT }>

export interface LabFilter {
  status?: LabStatus
  techId?: string
  patientId?: string
}

export function list(tx: ClinicTx, filter: LabFilter) {
  return tx.labOrder.findMany({
    where: {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.techId ? { techId: filter.techId } : {}),
      ...(filter.patientId ? { patientId: filter.patientId } : {}),
    },
    select: SELECT,
    orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
  })
}

export function findById(tx: ClinicTx, id: string) {
  return tx.labOrder.findUnique({ where: { id }, select: SELECT })
}

export interface NewLabOrder {
  patientId: string
  doctorId: string
  techId?: string | null
  teeth: number[]
  workType: LabWorkType
  material: LabMaterial
  shade?: string | null
  dueDate: Date
  techPrice: number
  note?: string | null
}

export function create(tx: ClinicTx, id: string, data: NewLabOrder) {
  return tx.labOrder.create({ data: tenantScoped({ id, ...data }), select: SELECT })
}

export function update(tx: ClinicTx, id: string, data: Prisma.LabOrderUpdateInput) {
  return tx.labOrder.update({ where: { id }, data, select: SELECT })
}

export function remove(tx: ClinicTx, id: string) {
  return tx.labOrder.delete({ where: { id } })
}
