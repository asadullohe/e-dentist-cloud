// visits moduli `visits`, `teeth` va `bridges` jadvallariga egalik qiladi.

import type { Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const VISIT_SELECT = {
  id: true,
  patientId: true,
  date: true,
  treatment: true,
  tooth: true,
  serviceId: true,
  price: true,
  note: true,
} satisfies Prisma.VisitSelect

const TOOTH_SELECT = {
  tooth: true,
  status: true,
  material: true,
  note: true,
} satisfies Prisma.ToothSelect

const BRIDGE_SELECT = {
  id: true,
  teeth: true,
  material: true,
} satisfies Prisma.BridgeSelect

export function listVisits(tx: ClinicTx, patientId: string) {
  return tx.visit.findMany({
    where: { patientId },
    select: VISIT_SELECT,
    // Yangi tashrif tepada. Bir kunda bir nechtasi boʻlsa — kiritilgan
    // tartibda: id vaqt boʻyicha tartiblangan (uuid v7)
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  })
}

/// Bemor boʻyicha tashriflar summasi. payments moduli qarzni shundan
/// hisoblaydi — u `visits` jadvaliga oʻzi murojaat qilmaydi
export async function chargeTotals(tx: ClinicTx): Promise<Map<string, number>> {
  const rows = await tx.visit.groupBy({ by: ['patientId'], _sum: { price: true } })
  return new Map(rows.map((row) => [row.patientId, row._sum.price ?? 0]))
}

export async function chargeTotalOf(tx: ClinicTx, patientId: string): Promise<number> {
  const row = await tx.visit.aggregate({ where: { patientId }, _sum: { price: true } })
  return row._sum.price ?? 0
}

export function createVisit(
  tx: ClinicTx,
  id: string,
  data: {
    patientId: string
    date: Date
    treatment: string
    tooth?: number | null
    serviceId?: string | null
    price: number
    note?: string | null
  },
) {
  return tx.visit.create({ data: tenantScoped({ id, ...data }), select: VISIT_SELECT })
}

export function updateVisit(tx: ClinicTx, id: string, data: Prisma.VisitUpdateInput) {
  return tx.visit.update({ where: { id }, data, select: VISIT_SELECT })
}

export function removeVisit(tx: ClinicTx, id: string) {
  return tx.visit.delete({ where: { id } })
}

/// Bemorning butun tish xaritasi: tishlar va koʻpriklar birga
export async function chart(tx: ClinicTx, patientId: string) {
  const [teeth, bridges] = await Promise.all([
    tx.tooth.findMany({ where: { patientId }, select: TOOTH_SELECT, orderBy: { tooth: 'asc' } }),
    tx.bridge.findMany({ where: { patientId }, select: BRIDGE_SELECT }),
  ])
  return { teeth, bridges }
}

/// Tishning holati birinchi marta belgilanayotgan boʻlishi ham mumkin,
/// shuning uchun upsert
export function setTooth(
  tx: ClinicTx,
  id: string,
  patientId: string,
  tooth: number,
  data: { status: string; material?: string | null; note?: string | null },
) {
  return tx.tooth.upsert({
    where: { patientId_tooth: { patientId, tooth } },
    create: tenantScoped({ id, patientId, tooth, ...data }),
    update: data,
    select: TOOTH_SELECT,
  })
}

/// «Sogʻlom» — sukut holati. Izoh va material ham boʻlmasa, qatorni saqlashning
/// maʼnosi yoʻq: xarita baribir shunday chiziladi
export function clearTooth(tx: ClinicTx, patientId: string, tooth: number) {
  return tx.tooth.deleteMany({ where: { patientId, tooth } })
}

export function findBridge(tx: ClinicTx, id: string) {
  return tx.bridge.findUnique({ where: { id }, select: { ...BRIDGE_SELECT, patientId: true } })
}

export function createBridge(
  tx: ClinicTx,
  id: string,
  patientId: string,
  teeth: number[],
  material: string,
) {
  return tx.bridge.create({ data: tenantScoped({ id, patientId, teeth, material }) })
}

export function removeBridge(tx: ClinicTx, id: string) {
  return tx.bridge.delete({ where: { id } })
}
