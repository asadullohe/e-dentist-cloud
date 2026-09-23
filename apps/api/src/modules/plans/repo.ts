// plans moduli toʻrt jadvalga egalik qiladi: `treatment_plans`,
// `treatment_plan_stages`, `treatment_plan_groups`, `treatment_plan_items`.
//
// clinicId ni kengaytma oʻzi qoʻyadi — bu yerda hech qayerda yozilmaydi.

import type { PlanItemStatus, PlanStatus, Prisma } from '../../../generated/prisma/client.js'
import type { Db } from '../../platform/db.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const ITEM_SELECT = {
  id: true,
  stageId: true,
  groupId: true,
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

const GROUP_SELECT = {
  id: true,
  stageId: true,
  name: true,
  teeth: true,
  pontics: true,
  material: true,
} satisfies Prisma.TreatmentPlanGroupSelect

const STAGE_SELECT = {
  id: true,
  planId: true,
  name: true,
  position: true,
  note: true,
  groups: { select: GROUP_SELECT, orderBy: { createdAt: 'asc' } },
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
export type GroupRow = Prisma.TreatmentPlanGroupGetPayload<{ select: typeof GROUP_SELECT }>

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

/// Ochiq sahifa (/r/<kod>) sessiyasiz ochiladi va RLS jadvallarni yopib
/// turadi — kodni klinikaga aylantirish uchun SECURITY DEFINER funksiya
/// (navbat sahifasidagi `clinic_by_queue_code` bilan bir xil uslub).
/// Rejaning oʻzi keyin odatdagi yoʻl bilan, `withClinic` ichida oʻqiladi
export interface PlanCodeRow {
  clinic_id: string
  plan_id: string
  name: string
  logo_key: string | null
  public_phone: string | null
  address: string | null
}

export async function findByPublicCode(db: Db, code: string): Promise<PlanCodeRow | null> {
  const rows = await db.$queryRaw<PlanCodeRow[]>`SELECT * FROM clinic_by_plan_code(${code})`
  return rows[0] ?? null
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

export interface GroupFields {
  stageId: string
  name: string
  teeth: number[]
  pontics: number[]
  material: string | null
}

export function createGroup(tx: ClinicTx, id: string, data: GroupFields) {
  return tx.treatmentPlanGroup.create({ data: tenantScoped({ id, ...data }), select: GROUP_SELECT })
}

export function updateGroup(tx: ClinicTx, id: string, data: Omit<GroupFields, 'stageId'>) {
  return tx.treatmentPlanGroup.update({ where: { id }, data, select: GROUP_SELECT })
}

/// Guruh oʻchsa bandlar qoladi — `group_id` FK si SET NULL
export function removeGroups(tx: ClinicTx, ids: string[]) {
  return tx.treatmentPlanGroup.deleteMany({ where: { id: { in: ids } } })
}

/// Tashrif oʻchirilayotganda (15.2): shu tashrifga bogʻlangan band va uning
/// guruhi. Guruh boʻlmasa koʻprik ham yoʻq
export function findItemByVisit(tx: ClinicTx, visitId: string) {
  return tx.treatmentPlanItem.findUnique({
    where: { visitId },
    select: { id: true, groupId: true },
  })
}

export interface ItemFields {
  stageId: string
  groupId: string | null
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

/// Konversiya hisoboti uchun: davrda **tuzilgan** rejalar. Sanash
/// tuzilgan sana boʻyicha — «sentyabrda 20 ta reja tuzildi, 12 tasi qabul
/// qilindi» degan savolga javob beradi (13.6)
export function createdBetween(tx: ClinicTx, from: Date, to: Date) {
  return tx.treatmentPlan.findMany({
    where: { createdAt: { gte: from, lt: to } },
    select: FULL_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

/// Toʻliq eksport uchun (export moduli)
export function allPlans(tx: ClinicTx) {
  return tx.treatmentPlan.findMany({
    select: FULL_SELECT,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  })
}

export function findItem(tx: ClinicTx, id: string) {
  return tx.treatmentPlanItem.findUnique({ where: { id }, select: ITEM_SELECT })
}

export function setItemStatus(
  tx: ClinicTx,
  id: string,
  data: { status: PlanItemStatus; visitId?: string | null },
) {
  return tx.treatmentPlanItem.update({ where: { id }, data, select: ITEM_SELECT })
}

/// Band qaysi rejaga tegishli — bosqich orqali
export function planIdOfStage(tx: ClinicTx, stageId: string) {
  return tx.treatmentPlanStage.findUnique({ where: { id: stageId }, select: { planId: true } })
}
