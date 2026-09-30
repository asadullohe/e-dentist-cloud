// lab moduli `lab_orders` va `labs` jadvallariga egalik qiladi.

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
  labId: true,
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
  /// Naryadni yozgan shifokor — shifokor faqat oʻzinikini koʻradi
  doctorId?: string
}

export function list(tx: ClinicTx, filter: LabFilter) {
  return tx.labOrder.findMany({
    where: {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.techId ? { techId: filter.techId } : {}),
      ...(filter.patientId ? { patientId: filter.patientId } : {}),
      ...(filter.doctorId ? { doctorId: filter.doctorId } : {}),
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
  labId?: string | null
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

export function update(tx: ClinicTx, id: string, data: Prisma.LabOrderUncheckedUpdateInput) {
  return tx.labOrder.update({ where: { id }, data, select: SELECT })
}

export function remove(tx: ClinicTx, id: string) {
  return tx.labOrder.delete({ where: { id } })
}

/// Toʻliq eksport uchun
export function allOrders(tx: ClinicTx) {
  return tx.labOrder.findMany({ select: SELECT, orderBy: [{ dueDate: 'asc' }, { id: 'asc' }] })
}

// ─────────────────────  Tashqi laboratoriyalar (tz.md 20-boʻlim)  ─────────────────────

const LAB_SELECT = { id: true, name: true, phone: true } satisfies Prisma.LabSelect

export type LabPlaceRow = Prisma.LabGetPayload<{ select: typeof LAB_SELECT }>

export function listLabs(tx: ClinicTx) {
  return tx.lab.findMany({ select: LAB_SELECT, orderBy: { name: 'asc' } })
}

export function findLab(tx: ClinicTx, id: string) {
  return tx.lab.findUnique({ where: { id }, select: LAB_SELECT })
}

export function createLab(tx: ClinicTx, id: string, data: { name: string; phone: string | null }) {
  return tx.lab.create({ data: tenantScoped({ id, ...data }), select: LAB_SELECT })
}

export function updateLab(
  tx: ClinicTx,
  id: string,
  data: { name?: string; phone?: string | null },
) {
  return tx.lab.update({ where: { id }, data, select: LAB_SELECT })
}

export function removeLab(tx: ClinicTx, id: string) {
  return tx.lab.delete({ where: { id } })
}

/// Oʻchirishdan oldin: naryadi bor laboratoriya oʻchirilmaydi — tarix buzilmasin
export function ordersOfLab(tx: ClinicTx, labId: string) {
  return tx.labOrder.count({ where: { labId } })
}
