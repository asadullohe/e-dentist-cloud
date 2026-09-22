// plans moduli uch jadvalga egalik qiladi: `treatment_plans`,
// `treatment_plan_stages`, `treatment_plan_items`.
//
// clinicId ni kengaytma oʻzi qoʻyadi — bu yerda hech qayerda yozilmaydi.

import type { PlanStatus, Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const ITEM_SELECT = {
  id: true,
  stageId: true,
  position: true,
  tooth: true,
  serviceId: true,
  treatment: true,
  price: true,
  qty: true,
  status: true,
  visitId: true,
  note: true,
} satisfies Prisma.TreatmentPlanItemSelect

const STAGE_SELECT = {
  id: true,
  planId: true,
  name: true,
  position: true,
  note: true,
  items: { select: ITEM_SELECT, orderBy: { position: 'asc' } },
} satisfies Prisma.TreatmentPlanStageSelect

const PLAN_SELECT = {
  id: true,
  patientId: true,
  doctorId: true,
  title: true,
  status: true,
  discount: true,
  validUntil: true,
  publicCode: true,
  note: true,
  acceptedAt: true,
  declinedAt: true,
  declineReason: true,
  cancelledAt: true,
  cancelReason: true,
  createdAt: true,
} satisfies Prisma.TreatmentPlanSelect

const FULL_SELECT = {
  ...PLAN_SELECT,
  stages: { select: STAGE_SELECT, orderBy: { position: 'asc' } },
} satisfies Prisma.TreatmentPlanSelect

export type PlanFullRow = Prisma.TreatmentPlanGetPayload<{ select: typeof FULL_SELECT }>
export type StageRow = Prisma.TreatmentPlanStageGetPayload<{ select: typeof STAGE_SELECT }>
export type ItemRow = Prisma.TreatmentPlanItemGetPayload<{ select: typeof ITEM_SELECT }>

export interface PlanFilter {
  patientId?: string
  status?: PlanStatus
  /// Shifokor koʻrinishi: faqat shu bemorlarning rejalari
  patientIds?: Iterable<string>
}

/// Roʻyxat ham bandlari bilan keladi: jami summa ularsiz hisoblanmaydi va
/// bemor kartochkasida rejalar soni koʻp boʻlmaydi
export function list(tx: ClinicTx, filter: PlanFilter) {
  return tx.treatmentPlan.findMany({
    where: {
      ...(filter.patientId ? { patientId: filter.patientId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.patientIds ? { patientId: { in: [...filter.patientIds] } } : {}),
    },
    select: FULL_SELECT,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  })
}

export function findById(tx: ClinicTx, id: string) {
  return tx.treatmentPlan.findUnique({ where: { id }, select: FULL_SELECT })
}

export interface NewPlan {
  patientId: string
  doctorId: string
  title: string
  discount: number
  validUntil: Date | null
  publicCode: string
  note: string | null
  createdBy: string
}

export function create(tx: ClinicTx, id: string, data: NewPlan) {
  return tx.treatmentPlan.create({ data: tenantScoped({ id, ...data }), select: PLAN_SELECT })
}

export function update(tx: ClinicTx, id: string, data: Prisma.TreatmentPlanUpdateInput) {
  return tx.treatmentPlan.update({ where: { id }, data, select: PLAN_SELECT })
}

// ─────────────────────────────  Bosqich va band  ─────────────────────────────

export interface StageFields {
  planId: string
  name: string
  position: number
  note: string | null
}

export function createStage(tx: ClinicTx, id: string, data: StageFields) {
  return tx.treatmentPlanStage.create({ data: tenantScoped({ id, ...data }), select: STAGE_SELECT })
}

export function updateStage(tx: ClinicTx, id: string, data: Omit<StageFields, 'planId'>) {
  return tx.treatmentPlanStage.update({ where: { id }, data, select: STAGE_SELECT })
}

export function removeStages(tx: ClinicTx, ids: string[]) {
  return tx.treatmentPlanStage.deleteMany({ where: { id: { in: ids } } })
}

export interface ItemFields {
  stageId: string
  position: number
  tooth: number | null
  serviceId: string | null
  treatment: string
  price: number
  qty: number
  note: string | null
}

export function createItem(tx: ClinicTx, id: string, data: ItemFields) {
  return tx.treatmentPlanItem.create({ data: tenantScoped({ id, ...data }), select: ITEM_SELECT })
}

export function updateItem(tx: ClinicTx, id: string, data: ItemFields) {
  return tx.treatmentPlanItem.update({ where: { id }, data, select: ITEM_SELECT })
}

export function removeItems(tx: ClinicTx, ids: string[]) {
  return tx.treatmentPlanItem.deleteMany({ where: { id: { in: ids } } })
}
