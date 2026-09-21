// Shifokorning band vaqti (12-bosqich): taʼtil, tushlik, oʻqish. Bu
// oraliqqa qabul yozilmaydi — tekshiruv service.ts dagi assertFree da.
// Shifokor (schedule.all yoʻq) faqat oʻzinikini koʻradi va yozadi

import { APPOINTMENT_TEXT } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as auth from '../auth/service.js'
import * as repo from './blockRepo.js'
import type { BlockCreateInput, BlockListInput } from './blockSchema.js'
import * as apptRepo from './repo.js'
import type { ScheduleDeps, ScheduleViewer } from './service.js'

export interface TimeBlock {
  id: string
  doctorId: string
  doctorName: string | null
  startsAt: Date
  endsAt: Date
  reason: string | null
}

const pad = (n: number) => String(n).padStart(2, '0')
/// Mahalliy lahza: jarayon TZ si Asia/Tashkent (platform/timezone.ts)
const instant = (date: string, time: string) => new Date(`${date}T${time}:00`)
export const timeOf = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

async function withNames(tx: ClinicTx, rows: repo.TimeBlockRow[]): Promise<TimeBlock[]> {
  const names = await auth.staffNamesTx(tx, [...new Set(rows.map((row) => row.doctorId))])
  return rows.map((row) => ({ ...row, doctorName: names.get(row.doctorId) ?? null }))
}

/// Shifokor faqat oʻzinikiga: boshqaniki «topilmadi»
function assertOwn(viewer: ScheduleViewer, doctorId: string): void {
  if (!viewer.all && doctorId !== viewer.userId)
    throw errors.notFound(APPOINTMENT_TEXT.block_not_found)
}

/// Oraliqda ochiq qabul boʻlsa band vaqt yozilmaydi — avval qabullar
/// koʻchirilsin; aks holda bemor bilmasdan «yoʻq» shifokorga kelaveradi
async function assertNoAppointments(tx: ClinicTx, doctorId: string, from: Date, to: Date) {
  const rows = await apptRepo.openByDoctor(tx, doctorId, from, to)
  // openByDoctor `at` boʻyicha tekshiradi; boshlanishi oldinroq boʻlib
  // oraliqqa kirib keladigan qabul ham hisobga olinsin
  const before = await apptRepo.openByDoctor(
    tx,
    doctorId,
    new Date(from.getTime() - 8 * 3600_000),
    from,
  )
  const crossing = before.filter(
    (row) => row.at.getTime() + row.durationMin * 60_000 > from.getTime(),
  )
  const count = rows.length + crossing.length
  if (count > 0) throw errors.conflict(APPOINTMENT_TEXT.block_has_appointments(count))
}

export function list(
  deps: ScheduleDeps,
  clinicId: string,
  viewer: ScheduleViewer,
  input: BlockListInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const from = new Date(`${input.from}T00:00:00`)
    const to = new Date(`${input.to}T00:00:00`)
    to.setDate(to.getDate() + 1)
    const doctorId = viewer.all ? input.doctorId : viewer.userId
    return withNames(tx, await repo.list(tx, from, to, doctorId))
  })
}

/// Berilgan lahzada shifokor band vaqtidami — qabul yozishda tekshiriladi.
/// Ochiq tranzaksiya ichida (service.ts chaqiradi)
export async function blockingTx(
  tx: ClinicTx,
  doctorId: string,
  from: Date,
  to: Date,
): Promise<repo.TimeBlockRow | undefined> {
  const rows = await repo.list(tx, from, to, doctorId)
  return rows[0]
}

export function create(
  deps: ScheduleDeps,
  clinicId: string,
  viewer: ScheduleViewer,
  input: BlockCreateInput,
) {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    // Hammani koʻradigan xodim shifokorni aniq tanlaydi — «berilmasa oʻziga»
    // yashirin xulq edi: egasi oʻziga band vaqt yozib qoʻyganini sezmasdi
    const doctorId = viewer.all ? input.doctorId : viewer.userId
    if (!doctorId) throw errors.validation({ doctorId: APPOINTMENT_TEXT.block_doctor_required })
    if (!(await auth.isDoctorTx(tx, doctorId)))
      throw errors.notFound(APPOINTMENT_TEXT.block_doctor_required)
    const startsAt = instant(input.fromDate, input.fromTime)
    const endsAt = instant(input.toDate, input.toTime)
    await assertNoAppointments(tx, doctorId, startsAt, endsAt)
    const created = await repo.create(tx, id, {
      doctorId,
      startsAt,
      endsAt,
      reason: input.reason ?? null,
      createdBy: viewer.userId,
    })
    await writeAudit(tx, {
      userId: viewer.userId,
      action: AUDIT_ACTION.appointment_changed,
      entity: 'time_block',
      entityId: id,
      meta: { doctorId },
    })
    return (await withNames(tx, [created]))[0]
  })
}

export function update(
  deps: ScheduleDeps,
  clinicId: string,
  viewer: ScheduleViewer,
  id: string,
  input: BlockCreateInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const existing = await repo.findById(tx, id)
    if (!existing) throw errors.notFound(APPOINTMENT_TEXT.block_not_found)
    assertOwn(viewer, existing.doctorId)
    const doctorId = viewer.all ? (input.doctorId ?? existing.doctorId) : viewer.userId
    if (!(await auth.isDoctorTx(tx, doctorId)))
      throw errors.notFound(APPOINTMENT_TEXT.block_doctor_required)
    const startsAt = instant(input.fromDate, input.fromTime)
    const endsAt = instant(input.toDate, input.toTime)
    await assertNoAppointments(tx, doctorId, startsAt, endsAt)
    const updated = await repo.update(tx, id, {
      doctorId,
      startsAt,
      endsAt,
      reason: input.reason ?? null,
    })
    await writeAudit(tx, {
      userId: viewer.userId,
      action: AUDIT_ACTION.appointment_changed,
      entity: 'time_block',
      entityId: id,
    })
    return (await withNames(tx, [updated]))[0]
  })
}

export function remove(deps: ScheduleDeps, clinicId: string, viewer: ScheduleViewer, id: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const existing = await repo.findById(tx, id)
    if (!existing) throw errors.notFound(APPOINTMENT_TEXT.block_not_found)
    assertOwn(viewer, existing.doctorId)
    await repo.remove(tx, id)
    await writeAudit(tx, {
      userId: viewer.userId,
      action: AUDIT_ACTION.appointment_changed,
      entity: 'time_block',
      entityId: id,
    })
  })
}
