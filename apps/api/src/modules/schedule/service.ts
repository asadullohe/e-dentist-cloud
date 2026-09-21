// Qabul jadvali.

import { APPOINTMENT_TEXT, PATIENT_TEXT } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import { type Bus, queueChannel } from '../../platform/bus.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as auth from '../auth/service.js'
import * as patients from '../patients/service.js'
import * as visits from '../visits/service.js'
import * as repo from './repo.js'
import type {
  AppointmentCompleteInput,
  AppointmentCreateInput,
  AppointmentListInput,
  AppointmentUpdateInput,
} from './schema.js'

export interface ScheduleDeps {
  db: Db
  /// Navbatdagi qabul yakunlanganda ochiq sahifa va kutish xonasi ekrani
  /// yangilanishi kerak
  bus: Bus
}

/// `2026-09-01` + `14:30` → mahalliy vaqtdagi lahza.
///
/// Server konteynerida TZ=Asia/Tashkent — shuning uchun `new Date(...)`
/// mahalliy vaqtni toʻgʻri oʻqiydi (platform/timezone.ts ga qarang)
function toInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`)
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025'
  )
}

/// Bemor shu klinikaniki va koʻruvchiga koʻrinadi (patients.all yoʻq
/// shifokor boshqaning bemoriga qabul yoza olmaydi)
async function assertPatient(
  tx: ClinicTx,
  viewer: ScheduleViewer,
  patientId: string,
): Promise<void> {
  if (!(await patients.isVisibleTx(tx, patientViewerOf(viewer), patientId))) {
    throw errors.notFound(PATIENT_TEXT.not_found)
  }
}

/// Qabuldagi shifokor faol va `visits.write` li xodim boʻlishi shart
async function assertDoctor(tx: ClinicTx, doctorId: string | null | undefined): Promise<void> {
  if (!doctorId) return
  if (!(await auth.isDoctorTx(tx, doctorId))) {
    throw errors.validation(
      { doctorId: PATIENT_TEXT.doctor_not_found },
      PATIENT_TEXT.doctor_not_found,
    )
  }
}

export interface Appointment {
  id: string
  /// Navbatga ochiq sahifadan yozilgan odam kartotekada boʻlmasligi mumkin
  patientId: string | null
  /// Qabul qiladigan shifokor. Sukut — bemorning biriktirilgan shifokori
  doctorId: string | null
  doctorName: string | null
  at: Date
  /// Daqiqa. Navbat yozuvida sukut (30) — maʼnosi yoʻq
  duration: number
  /// Navbatdan (QR yoki kabinet) kelgan yozuv — vaqti yozilgan lahza,
  /// jadvalda oddiy qabuldan farqli koʻrsatiladi
  fromQueue: boolean
  status: string
  note: string | null
  /// Kartotekadagi ism, boʻlmasa oʻzi yozgan ism
  fio: string
  phone: string | null
}

/// Kim soʻrayapti. `schedule.all` boʻlmasa (shifokor) jadval faqat oʻz
/// qabullaridan iborat: roʻyxatda boshqalarniki chiqmaydi, yangi qabul
/// oʻziga yoziladi, boshqaning qabuli «topilmadi» (10.7)
export interface ScheduleViewer {
  userId: string
  /// `schedule.all` — hamma shifokorning qabullari
  all: boolean
  /// `patients.all` — bemorlar tekshiruvi uchun (qabul yozish, yakunlash):
  /// shifokor faqat oʻziga koʻrinadigan bemorga qabul yozadi
  patientsAll: boolean
}

const patientViewerOf = (viewer: ScheduleViewer) => ({
  userId: viewer.userId,
  all: viewer.patientsAll,
})

/// Boshqa shifokorning qabuli — cheklangan koʻruvchi uchun yoʻq
function assertVisible(viewer: ScheduleViewer, row: { doctorId: string | null }): void {
  if (!viewer.all && row.doctorId !== viewer.userId)
    throw errors.notFound(APPOINTMENT_TEXT.not_found)
}

/// Bemor nomlarini qoʻshadi. `patients` boshqa modulning jadvali, shuning
/// uchun uning servisidan soʻraladi
async function withPatients(
  tx: ClinicTx,
  rows: {
    id: string
    patientId: string | null
    doctorId: string | null
    at: Date
    durationMin: number
    queueStatus: string | null
    status: string
    note: string | null
    guestName: string | null
    guestPhone: string | null
  }[],
): Promise<Appointment[]> {
  const ids = rows.map((row) => row.patientId).filter((id): id is string => id !== null)
  const doctorIds = rows.map((row) => row.doctorId).filter((id): id is string => id !== null)
  const [people, doctorNames] = await Promise.all([
    patients.findByIds(tx, [...new Set(ids)]),
    auth.staffNamesTx(tx, [...new Set(doctorIds)]),
  ])
  const byId = new Map(people.map((person) => [person.id, person]))

  return rows.map((row) => {
    const person = row.patientId ? byId.get(row.patientId) : undefined
    return {
      id: row.id,
      patientId: row.patientId,
      doctorId: row.doctorId,
      doctorName: row.doctorId ? (doctorNames.get(row.doctorId) ?? null) : null,
      at: row.at,
      duration: row.durationMin,
      fromQueue: row.queueStatus !== null,
      status: row.status,
      note: row.note,
      fio: person?.fio ?? row.guestName ?? '',
      phone: person?.phone ?? row.guestPhone ?? null,
    }
  })
}

/// Bir shifokorga bir vaqtda ikki qabul yozilmaydi: yangi oraliq [at, at+dur)
/// mavjud ochiq qabul bilan kesishsa — 409, xabarda kimniki va qachon.
/// Faqat oʻsha kun ichida tekshiriladi (yarim tundan oʻtgan qabul yoʻq)
async function assertFree(
  tx: ClinicTx,
  doctorId: string | null,
  at: Date,
  duration: number,
  excludeId?: string,
): Promise<void> {
  if (!doctorId) return
  const dayStart = new Date(at.getFullYear(), at.getMonth(), at.getDate())
  const dayEnd = new Date(at.getFullYear(), at.getMonth(), at.getDate() + 1)
  const rows = await repo.openByDoctor(tx, doctorId, dayStart, dayEnd)
  const from = at.getTime()
  const to = from + duration * 60_000
  const clash = rows.find((row) => {
    if (row.id === excludeId) return false
    const start = row.at.getTime()
    return start < to && start + row.durationMin * 60_000 > from
  })
  if (!clash) return
  const end = new Date(clash.at.getTime() + clash.durationMin * 60_000)
  const range = `${formatLocalTime(clash.at)}–${formatLocalTime(end)}`
  const person = clash.patientId ? (await patients.findByIds(tx, [clash.patientId]))[0] : undefined
  throw errors.conflict(APPOINTMENT_TEXT.slot_busy(range, person?.fio ?? clash.guestName ?? ''))
}

export function list(
  deps: ScheduleDeps,
  clinicId: string,
  viewer: ScheduleViewer,
  input: AppointmentListInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    // `to` chegarasi kiritiladi: oxirgi kunning qabullari ham chiqsin
    const from = new Date(`${input.from}T00:00:00`)
    const to = new Date(`${input.to}T00:00:00`)
    to.setDate(to.getDate() + 1)

    // Cheklangan koʻruvchi filtrni tanlay olmaydi — doim oʻzi
    const doctorId = viewer.all ? input.doctorId : viewer.userId
    return withPatients(tx, await repo.list(tx, from, to, doctorId))
  })
}

export function create(
  deps: ScheduleDeps,
  clinicId: string,
  viewer: ScheduleViewer,
  input: AppointmentCreateInput,
) {
  const { userId } = viewer
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, viewer, input.patientId)
    // Shifokor berilmasa — bemorning biriktirilgan shifokori (10.2).
    // Cheklangan koʻruvchi (shifokor) faqat oʻziga yozadi — aks holda qabul
    // oʻz jadvalidan gʻoyib boʻlardi
    const doctorId = !viewer.all
      ? userId
      : input.doctorId === undefined
        ? ((await patients.findByIds(tx, [input.patientId]))[0]?.doctorId ?? null)
        : input.doctorId
    await assertDoctor(tx, doctorId)
    const at = toInstant(input.date, input.time)
    await assertFree(tx, doctorId, at, input.duration)

    const created = await repo.create(tx, id, {
      patientId: input.patientId,
      doctorId,
      at,
      durationMin: input.duration,
      note: input.note ?? null,
    })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.appointment_changed,
      entity: 'appointment',
      entityId: id,
      meta: { patientId: input.patientId },
    })
    return (await withPatients(tx, [created]))[0]
  })
}

export function update(
  deps: ScheduleDeps,
  clinicId: string,
  viewer: ScheduleViewer,
  id: string,
  input: AppointmentUpdateInput,
) {
  const { userId } = viewer
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      const existing = await repo.findById(tx, id)
      if (!existing) throw errors.notFound(APPOINTMENT_TEXT.not_found)
      assertVisible(viewer, existing)
      // Cheklangan koʻruvchi shifokorni oʻzgartira olmaydi — qabul oʻzida qoladi
      if (!viewer.all) input = { ...input, doctorId: undefined }
      // «Yakunlandi» faqat tashrif bilan birga qoʻyiladi — complete() (10.6)
      if (input.status === 'done' && existing.status !== 'done')
        throw errors.badRequest(APPOINTMENT_TEXT.done_needs_visit)

      // Sana yoki vaqtdan faqat bittasi kelsa, ikkinchisi eskisidan olinadi
      const at =
        input.date === undefined && input.time === undefined
          ? undefined
          : toInstant(
              input.date ?? existing.at.toISOString().slice(0, 10),
              input.time ?? formatLocalTime(existing.at),
            )

      await assertDoctor(tx, input.doctorId)
      // Vaqt, davomiylik yoki shifokor oʻzgarsa — yangi oraliq boʻsh boʻlsin
      const nextDoctor = input.doctorId === undefined ? existing.doctorId : input.doctorId
      const nextStatus = input.status ?? existing.status
      if (
        (at !== undefined || input.duration !== undefined || input.doctorId !== undefined) &&
        (nextStatus === 'scheduled' || nextStatus === 'arrived') &&
        existing.queueStatus === null
      ) {
        await assertFree(
          tx,
          nextDoctor,
          at ?? existing.at,
          input.duration ?? existing.durationMin,
          id,
        )
      }
      const updated = await repo.update(tx, id, {
        ...(at === undefined ? {} : { at }),
        ...(input.duration === undefined ? {} : { durationMin: input.duration }),
        ...(input.doctorId === undefined ? {} : { doctorId: input.doctorId }),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.note === undefined ? {} : { note: input.note }),
      })
      await writeAudit(tx, {
        userId,
        action: AUDIT_ACTION.appointment_changed,
        entity: 'appointment',
        entityId: id,
      })
      return (await withPatients(tx, [updated]))[0]
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(APPOINTMENT_TEXT.not_found)
      throw error
    }
  })
}

/// Qabulni yakunlash: nima qilingani tashrif boʻlib yoziladi va qabul
/// «done» boʻladi — bitta tranzaksiyada. Navbatdagi qabul boʻlsa navbat ham
/// tugaydi. Shifokor: berilgani → qabulniki → bemorniki; hech biri boʻlmasa
/// tashrif xizmati «shifokorni tanlang» deydi (yozayotgan odam shifokor
/// boʻlmasa)
export function complete(
  deps: ScheduleDeps,
  clinicId: string,
  viewer: ScheduleViewer,
  id: string,
  input: AppointmentCompleteInput,
) {
  const { userId } = viewer
  return withClinic(deps.db, clinicId, async (tx) => {
    const existing = await repo.findQueueEntry(tx, id)
    if (!existing) throw errors.notFound(APPOINTMENT_TEXT.not_found)
    assertVisible(viewer, existing)
    if (!existing.patientId) throw errors.badRequest(APPOINTMENT_TEXT.patient_required)
    if (existing.status === 'done') throw errors.conflict(APPOINTMENT_TEXT.already_done)

    const doctorId =
      input.doctorId ??
      existing.doctorId ??
      (await patients.findByIds(tx, [existing.patientId]))[0]?.doctorId ??
      undefined

    const visit = await visits.createTx(tx, patientViewerOf(viewer), {
      ...input,
      ...(doctorId ? { doctorId } : {}),
      patientId: existing.patientId,
      // Kelajakdagi qabul bugun yakunlansa — ish bugun qilingan: tashrif
      // sanasi kelajakka tushmaydi
      date: minDate(localDate(existing.at), localDate(new Date())),
    })

    const updated = await repo.update(tx, id, {
      status: 'done',
      ...(existing.queueStatus !== null ? { queueStatus: 'finished' } : {}),
    })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.appointment_changed,
      entity: 'appointment',
      entityId: id,
      meta: { status: 'done', visitId: visit.id },
    })
    if (existing.queueStatus !== null) await deps.bus.publish(queueChannel(clinicId))

    const [appointment] = await withPatients(tx, [updated])
    return { appointment, visit }
  })
}

/// Lahza → mahalliy sana (YYYY-MM-DD). Jarayon TZ si Asia/Tashkent
const minDate = (a: string, b: string) => (a < b ? a : b)

function localDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatLocalTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function remove(deps: ScheduleDeps, clinicId: string, viewer: ScheduleViewer, id: string) {
  const { userId } = viewer
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      if (!viewer.all) {
        const existing = await repo.findById(tx, id)
        if (!existing) throw errors.notFound(APPOINTMENT_TEXT.not_found)
        assertVisible(viewer, existing)
      }
      await repo.remove(tx, id)
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(APPOINTMENT_TEXT.not_found)
      throw error
    }
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.appointment_changed,
      entity: 'appointment',
      entityId: id,
    })
  })
}

/// Toʻliq eksport uchun (export moduli)
export function exportAppointmentsTx(tx: ClinicTx) {
  return repo.allAppointments(tx)
}
