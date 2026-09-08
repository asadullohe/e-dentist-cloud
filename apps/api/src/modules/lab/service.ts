// Naryadlar. Shifokor yozadi, texnik bajaradi (tz.md 7-boʻlim).
//
// Bemor ismi va xodim ismlari boshqa modullarning jadvallarida — ular
// `patients` va `auth` ning xizmat qatlamidan olinadi, jadvalga tegilmaydi.

import {
  LAB_TEXT,
  LAB_WORK_TYPE_LABELS,
  PATIENT_TEXT,
  type Permission,
  todayISO,
} from '@e-dentist/shared'
import type { LabStatus } from '../../../generated/prisma/client.js'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as auth from '../auth/service.js'
import * as expenses from '../expenses/service.js'
import * as patients from '../patients/service.js'
import * as visits from '../visits/service.js'
import * as repo from './repo.js'
import type { LabCreateInput, LabListInput, LabReturnInput, LabUpdateInput } from './schema.js'

export interface LabDeps {
  db: Db
}

export interface LabOrderView {
  id: string
  patientId: string
  fio: string
  doctorId: string
  doctorName: string
  techId: string | null
  techName: string | null
  teeth: number[]
  workType: string
  material: string
  shade: string | null
  dueDate: string
  status: LabStatus
  note: string | null
  returns: number
  returnReason: string | null
  returnNote: string | null
  /// Muddati oʻtganmi — topshirilmagan va sana kechagi
  overdue: boolean
  /// `lab.cost` boʻlmasa yoki naryad oʻzinikimas boʻlsa — javobda yoʻq
  techPrice?: number
}

/// Naryad materiali → tish xaritasidagi material (packages/teeth).
/// Neylon protez uchun — tishga yozadigan material yoʻq
const TOOTH_MATERIAL: Record<string, string> = {
  metal_ceramic: 'metall-keramika',
  zirconia: 'sirkoniy',
  press_ceramic: 'keramika',
  acrylic: 'plastmassa',
  cast_metal: 'metall',
  nylon: '',
}

/// Qaysi ish turi tishning holatini oʻzgartiradi. Olinadigan protez, kappa
/// va plastinka tishga oʻrnatilmaydi — ular xaritaga tegmaydi
const TOOTH_STATUS_BY_WORK: Record<string, string | undefined> = {
  crown: 'koronka',
  bridge: 'koprik',
  veneer: 'koronka',
  inlay: 'koronka',
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/// Texnik oʻz narxini koʻradi (tz.md 7-boʻlim), boshqalar uchun `lab.cost`
function canSeePrice(
  row: repo.LabRow,
  userId: string,
  permissions: readonly Permission[],
): boolean {
  return permissions.includes('lab.cost') || row.techId === userId
}

async function toView(
  tx: ClinicTx,
  rows: repo.LabRow[],
  userId: string,
  permissions: readonly Permission[],
): Promise<LabOrderView[]> {
  const today = todayISO()

  const people = await patients.findByIds(tx, [...new Set(rows.map((row) => row.patientId))])
  const fio = new Map(people.map((person) => [person.id, person.fio]))

  const staffIds = new Set<string>()
  for (const row of rows) {
    staffIds.add(row.doctorId)
    if (row.techId) staffIds.add(row.techId)
  }
  const names = await auth.staffNamesTx(tx, [...staffIds])

  return rows.map((row) => {
    const due = toIso(row.dueDate)
    const view: LabOrderView = {
      id: row.id,
      patientId: row.patientId,
      fio: fio.get(row.patientId) ?? '',
      doctorId: row.doctorId,
      doctorName: names.get(row.doctorId) ?? '',
      techId: row.techId,
      techName: row.techId ? (names.get(row.techId) ?? '') : null,
      teeth: row.teeth,
      workType: row.workType,
      material: row.material,
      shade: row.shade,
      dueDate: due,
      status: row.status,
      note: row.note,
      returns: row.returns,
      returnReason: row.returnReason,
      returnNote: row.returnNote,
      overdue: row.status !== 'delivered' && due < today,
    }
    if (canSeePrice(row, userId, permissions)) view.techPrice = row.techPrice
    return view
  })
}

/// Muddati oʻtganlari tepada, keyin muddat boʻyicha (tz.md 7-boʻlim)
function sortOverdueFirst(rows: LabOrderView[]): LabOrderView[] {
  return rows.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
    return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0
  })
}

async function load(tx: ClinicTx, id: string): Promise<repo.LabRow> {
  const row = await repo.findById(tx, id)
  if (!row) throw errors.notFound(LAB_TEXT.not_found)
  return row
}

async function assertPatient(tx: ClinicTx, patientId: string): Promise<void> {
  if (!(await patients.existsInClinic(tx, patientId))) {
    throw errors.notFound(PATIENT_TEXT.not_found)
  }
}

async function assertTech(tx: ClinicTx, techId: string | null | undefined): Promise<void> {
  if (!techId) return
  if (!(await auth.existsInClinic(tx, techId))) throw errors.notFound(LAB_TEXT.tech_not_found)
}

export function list(
  deps: LabDeps,
  clinicId: string,
  userId: string,
  permissions: readonly Permission[],
  input: LabListInput,
): Promise<LabOrderView[]> {
  // `lab.write` yoʻq boʻlsa — texnik: faqat oʻziga biriktirilganlari
  const techId = permissions.includes('lab.write') ? input.techId : userId

  return withClinic(deps.db, clinicId, async (tx) => {
    const rows = await repo.list(tx, {
      ...(input.status ? { status: input.status } : {}),
      ...(techId ? { techId } : {}),
      ...(input.patientId ? { patientId: input.patientId } : {}),
    })
    return sortOverdueFirst(await toView(tx, rows, userId, permissions))
  })
}

export function create(
  deps: LabDeps,
  clinicId: string,
  userId: string,
  permissions: readonly Permission[],
  input: LabCreateInput,
): Promise<LabOrderView> {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, input.patientId)
    await assertTech(tx, input.techId)

    const created = await repo.create(tx, id, {
      patientId: input.patientId,
      doctorId: userId,
      techId: input.techId ?? null,
      teeth: input.teeth,
      workType: input.workType,
      material: input.material,
      shade: input.shade ?? null,
      dueDate: toDate(input.dueDate),
      techPrice: input.techPrice,
      note: input.note ?? null,
    })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.lab_created,
      entity: 'lab_order',
      entityId: id,
    })
    const [view] = await toView(tx, [created], userId, permissions)
    return view as LabOrderView
  })
}

export function update(
  deps: LabDeps,
  clinicId: string,
  userId: string,
  permissions: readonly Permission[],
  id: string,
  input: LabUpdateInput,
): Promise<LabOrderView> {
  // Narxni faqat `lab.cost` oʻzgartiradi — texnik oʻzinikini koʻradi, lekin
  // yoza olmaydi
  if (input.techPrice !== undefined && !permissions.includes('lab.cost')) {
    throw errors.forbidden()
  }

  return withClinic(deps.db, clinicId, async (tx) => {
    await load(tx, id)
    await assertTech(tx, input.techId)

    const updated = await repo.update(tx, id, {
      ...(input.techId === undefined ? {} : { techId: input.techId }),
      ...(input.teeth === undefined ? {} : { teeth: input.teeth }),
      ...(input.workType === undefined ? {} : { workType: input.workType }),
      ...(input.material === undefined ? {} : { material: input.material }),
      ...(input.shade === undefined ? {} : { shade: input.shade }),
      ...(input.dueDate === undefined ? {} : { dueDate: toDate(input.dueDate) }),
      ...(input.techPrice === undefined ? {} : { techPrice: input.techPrice }),
      ...(input.note === undefined ? {} : { note: input.note }),
    })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.lab_updated,
      entity: 'lab_order',
      entityId: id,
    })
    const [view] = await toView(tx, [updated], userId, permissions)
    return view as LabOrderView
  })
}

/// Berildi → tayyor → topshirildi. Orqaga qaytish faqat «qaytarildi» amali
/// orqali boʻladi
export function setStatus(
  deps: LabDeps,
  clinicId: string,
  userId: string,
  permissions: readonly Permission[],
  id: string,
  status: LabStatus,
): Promise<LabOrderView> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const row = await load(tx, id)

    if (status === 'ready') {
      if (row.status !== 'issued') throw errors.badRequest(LAB_TEXT.status_flow)
      // Texnik faqat oʻziga biriktirilganini tayyor deb belgilaydi
      if (!permissions.includes('lab.write') && row.techId !== userId) {
        throw errors.forbidden(LAB_TEXT.not_your_order)
      }
    } else if (status === 'delivered') {
      if (row.status !== 'ready') throw errors.badRequest(LAB_TEXT.status_flow)
      // Topshirilganini shifokor yoki qabulxona belgilaydi, texnik emas
      if (!permissions.includes('lab.write')) throw errors.forbidden()
    } else {
      // `issued` ga qaytish — alohida amal, sababi bilan
      throw errors.badRequest(LAB_TEXT.status_flow)
    }

    const updated = await repo.update(tx, id, {
      status,
      ...(status === 'delivered' ? { deliveredAt: new Date() } : {}),
    })

    if (status === 'delivered') await onDelivered(tx, updated, userId)

    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.lab_status_changed,
      entity: 'lab_order',
      entityId: id,
      meta: { status },
    })
    const [view] = await toView(tx, [updated], userId, permissions)
    return view as LabOrderView
  })
}

/// «Qaytarildi» — holat emas, amal: naryad «Tayyor» dan «Berildi» ga
/// qaytadi, sababi yoziladi va qaytishlar soni oshadi (tz.md 7-boʻlim)
export function markReturned(
  deps: LabDeps,
  clinicId: string,
  userId: string,
  permissions: readonly Permission[],
  id: string,
  input: LabReturnInput,
): Promise<LabOrderView> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const row = await load(tx, id)
    if (row.status !== 'ready') throw errors.badRequest(LAB_TEXT.return_from_ready)

    const updated = await repo.update(tx, id, {
      status: 'issued',
      returns: { increment: 1 },
      returnReason: input.reason,
      returnNote: input.note ?? null,
    })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.lab_returned,
      entity: 'lab_order',
      entityId: id,
      meta: { reason: input.reason },
    })
    const [view] = await toView(tx, [updated], userId, permissions)
    return view as LabOrderView
  })
}

/// Naryad topshirilgandagi ikki bogʻlanish (tz.md 7-boʻlim):
///
///   1. tish xaritasi — shifokor qoʻlda ikkinchi marta kiritmaydi
///   2. texnik narxi xarajatga tushadi — busiz hisobotdagi sof foyda yolgʻon
///
/// Ikkalasi ham shu tranzaksiya ichida: naryad topshirildi deb yozilib,
/// xarajat yozilmay qolishi mumkin emas
async function onDelivered(tx: ClinicTx, row: repo.LabRow, userId: string): Promise<void> {
  const toothStatus = TOOTH_STATUS_BY_WORK[row.workType]
  if (toothStatus) {
    const material = TOOTH_MATERIAL[row.material] ?? ''
    for (const tooth of row.teeth) {
      await visits.setToothTx(tx, row.patientId, tooth, { status: toothStatus, material })
    }
  }

  // Narx yozilmagan boʻlsa xarajat ham yoʻq
  if (row.techPrice <= 0) return

  const [person] = await patients.findByIds(tx, [row.patientId])
  const work = LAB_WORK_TYPE_LABELS[row.workType as keyof typeof LAB_WORK_TYPE_LABELS]
  const expense = await expenses.addTx(tx, {
    date: toDate(todayISO()),
    category: 'lab',
    description: LAB_TEXT.expense_note(work, person?.fio ?? ''),
    amount: row.techPrice,
  })
  await writeAudit(tx, {
    userId,
    action: AUDIT_ACTION.expense_changed,
    entity: 'expense',
    entityId: expense.id,
    meta: { labOrderId: row.id },
  })
}

export function remove(deps: LabDeps, clinicId: string, userId: string, id: string): Promise<void> {
  return withClinic(deps.db, clinicId, async (tx) => {
    await load(tx, id)
    await repo.remove(tx, id)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.lab_deleted,
      entity: 'lab_order',
      entityId: id,
    })
  })
}
