// Navbat. Ochiq sahifa (/n/<kod>) shu yerdan oziqlanadi.
//
// Nega alohida modul emas: navbat — bu «bugungi, vaqti belgilanmagan
// qabul», yaʼni ayni `appointments` jadvali (tz.md 14-boʻlim). Ikkita
// parallel tizim qurilmaydi, shuning uchun mantiq jadval egasi — `schedule`
// modulida, faqat alohida faylda turadi.

import { normalizePhone, QUEUE_TEXT } from '@e-dentist/shared'
import type { QueueStatus } from '../../../generated/prisma/client.js'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import { type Bus, queueChannel } from '../../platform/bus.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import type { RateLimiter } from '../../platform/rateLimit.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as auth from '../auth/service.js'
import * as clinics from '../clinics/service.js'
import * as patients from '../patients/service.js'
import type { QueueJoinInput, QueueStatusInput } from './queueSchema.js'
import * as repo from './repo.js'

export interface QueueDeps {
  db: Db
  rateLimiter: RateLimiter
  bus: Bus
}

/// Bitta IP dan soatiga nechta yozuv. Qurilma boʻyicha cheklov 4.6 da
const JOIN_IP_LIMIT = 5
const JOIN_WINDOW = 60 * 60

/// Kutish vaqti hisobi uchun oxirgi nechta qabul olinadi
const SAMPLE_SIZE = 20
/// Namuna yetarli boʻlmasa shu qiymat ishlatiladi
const DEFAULT_MINUTES = 15
const MIN_MINUTES = 5
const MAX_MINUTES = 60

export interface DoctorBoard {
  id: string
  fullName: string
  waiting: number
  waitMinutes: number
}

export interface Board {
  clinicName: string
  doctors: DoctorBoard[]
}

export interface Ticket {
  id: string
  number: number
  ahead: number
  status: QueueStatus
  doctorName: string
  waitMinutes: number
}

/// Bugungi kunning chegaralari. Jarayon TZ si Asia/Tashkent, shuning uchun
/// mahalliy konstruktor toʻgʻri lahzani beradi (platform/timezone.ts)
function today(): { from: Date; to: Date } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return { from, to }
}

/// «Navbatda» deb kutayotgan va chaqirilganlar sanaladi. Tasdiqlanmagan
/// yozuv hali navbat emas — qabulxona koʻrib chiqishi kerak
function inQueue(status: QueueStatus | null): boolean {
  return status === 'waiting' || status === 'called'
}

/// Oxirgi qabullarning tugash oraligʻi boʻyicha oʻrtacha davomiylik.
/// Aniq emas, lekin «10 daqiqa» deb yolgʻon aytishdan yaxshi (tz.md 14-boʻlim)
function averageMinutes(finishedAt: Date[]): number {
  if (finishedAt.length < 3) return DEFAULT_MINUTES

  const times = finishedAt.map((date) => date.getTime()).sort((a, b) => a - b)
  const gaps: number[] = []
  times.reduce((previous, current) => {
    const minutes = (current - previous) / 60_000
    // Kun oralab ketgan sakrashlar oʻrtachani buzmasin
    if (minutes > 0 && minutes <= MAX_MINUTES * 2) gaps.push(minutes)
    return current
  })
  if (gaps.length === 0) return DEFAULT_MINUTES

  const average = gaps.reduce((sum, value) => sum + value, 0) / gaps.length
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(average)))
}

async function findClinic(deps: QueueDeps, code: string) {
  const clinic = await clinics.findByQueueCode(deps.db, code)
  if (!clinic) throw errors.notFound(QUEUE_TEXT.clinic_not_found)
  if (!clinic.queue_enabled) throw errors.forbidden(QUEUE_TEXT.queue_off)
  return clinic
}

/// Ochiq sahifadagi asosiy koʻrinish: shifokorlar va ularning navbati
export function board(deps: QueueDeps, code: string): Promise<Board> {
  return findClinic(deps, code).then((clinic) =>
    withClinic(deps.db, clinic.id, async (tx) => {
      const { from, to } = today()
      const [doctors, entries, finished] = await Promise.all([
        auth.listDoctorsTx(tx),
        repo.queueOfDay(tx, from, to),
        repo.recentlyFinished(tx, SAMPLE_SIZE),
      ])

      const minutes = averageMinutes(finished.map((row) => row.updatedAt))
      const waitingByDoctor = new Map<string, number>()
      for (const entry of entries) {
        if (!inQueue(entry.queueStatus) || !entry.doctorId) continue
        waitingByDoctor.set(entry.doctorId, (waitingByDoctor.get(entry.doctorId) ?? 0) + 1)
      }

      return {
        clinicName: clinic.name,
        doctors: doctors.map((doctor) => {
          const waiting = waitingByDoctor.get(doctor.id) ?? 0
          return { ...doctor, waiting, waitMinutes: waiting * minutes }
        }),
      }
    }),
  )
}

/// Kutish xonasi ekrani. Ismlar yoʻq — faqat raqamlar (tz.md 14-boʻlim:
/// kutayotgan odamlar bir-birining ismini bilmasligi kerak)
export interface Screen {
  clinicName: string
  called: { number: number; doctorName: string }[]
  next: number[]
}

/// Ekranda nechta keyingi raqam koʻrsatiladi
const NEXT_SHOWN = 3

export function screen(deps: QueueDeps, code: string): Promise<Screen> {
  return findClinic(deps, code).then((clinic) =>
    withClinic(deps.db, clinic.id, async (tx) => {
      const { from, to } = today()
      const [entries, doctors] = await Promise.all([
        repo.queueOfDay(tx, from, to),
        auth.listDoctorsTx(tx),
      ])
      const doctorName = new Map(doctors.map((doctor) => [doctor.id, doctor.fullName]))

      return {
        clinicName: clinic.name,
        called: entries
          .filter((entry) => entry.queueStatus === 'called' && entry.queueNumber !== null)
          .map((entry) => ({
            number: entry.queueNumber as number,
            doctorName: entry.doctorId ? (doctorName.get(entry.doctorId) ?? '') : '',
          })),
        next: entries
          .filter((entry) => entry.queueStatus === 'waiting' && entry.queueNumber !== null)
          .slice(0, NEXT_SHOWN)
          .map((entry) => entry.queueNumber as number),
      }
    }),
  )
}

export async function join(
  deps: QueueDeps,
  code: string,
  input: QueueJoinInput,
  ip: string,
): Promise<Ticket> {
  const clinic = await findClinic(deps, code)

  const check = await deps.rateLimiter.hit(`queue:ip:${ip}`, JOIN_IP_LIMIT, JOIN_WINDOW)
  if (!check.allowed) throw errors.rateLimited(QUEUE_TEXT.too_many)

  return withClinic(deps.db, clinic.id, async (tx) => {
    const doctors = await auth.listDoctorsTx(tx)
    const doctor = doctors.find((item) => item.id === input.doctorId)
    if (!doctor) throw errors.notFound(QUEUE_TEXT.doctor_not_found)

    // Raqam berish ketma-ket boʻlishi kerak: qulf tranzaksiya bilan tugaydi
    await repo.lockQueueNumbering(tx, clinic.id)

    const { from, to } = today()
    const number = (await repo.lastQueueNumber(tx, from, to)) + 1

    const created = await repo.createQueueEntry(tx, uuidV7(), {
      doctorId: input.doctorId,
      at: new Date(),
      queueNumber: number,
      // Qabulxona tasdiqlaguncha navbatda emas — soxta yozuv navbatni
      // buzmaydi (tz.md 14-boʻlim)
      queueStatus: 'unconfirmed',
      guestName: input.fullName,
      // Kartotekadagi bilan bir xil koʻrinishda saqlaymiz — tasdiqlashda
      // telefon boʻyicha topish shunga bogʻliq
      guestPhone: normalizePhone(input.phone),
      // Kartoteka bilan bogʻlash qabulxona tasdiqlaganda boʻladi: ochiq
      // sahifa bemorlar jadvaliga umuman tegmaydi
      patientId: null,
    })

    const entries = await repo.queueOfDay(tx, from, to, input.doctorId)
    const finished = await repo.recentlyFinished(tx, SAMPLE_SIZE)

    // Ochiq sahifalar va kutish xonasi ekrani darhol yangilansin
    await deps.bus.publish(queueChannel(clinic.id))

    return toTicket(
      created,
      entries,
      doctor.fullName,
      averageMinutes(finished.map((r) => r.updatedAt)),
    )
  })
}

/// Ochiq sahifa shu oqimga ulanadi. Xabar boʻsh: «navbat oʻzgardi»,
/// mijoz kerakli soʻrovni oʻzi qaytadan yuboradi
export async function watch(
  deps: QueueDeps,
  code: string,
  onChange: () => void,
): Promise<() => void> {
  const clinic = await findClinic(deps, code)
  return deps.bus.subscribe(queueChannel(clinic.id), onChange)
}

/// Bemor oʻz raqamini kuzatadi
export function ticket(deps: QueueDeps, code: string, id: string): Promise<Ticket> {
  return findClinic(deps, code).then((clinic) =>
    withClinic(deps.db, clinic.id, async (tx) => {
      const entry = await repo.findQueueEntry(tx, id)
      if (!entry || entry.queueStatus === null) throw errors.notFound(QUEUE_TEXT.ticket_not_found)

      const { from, to } = today()
      const [entries, finished, doctors] = await Promise.all([
        repo.queueOfDay(tx, from, to, entry.doctorId ?? undefined),
        repo.recentlyFinished(tx, SAMPLE_SIZE),
        auth.listDoctorsTx(tx),
      ])
      const doctor = doctors.find((item) => item.id === entry.doctorId)

      return toTicket(
        entry,
        entries,
        doctor?.fullName ?? '',
        averageMinutes(finished.map((row) => row.updatedAt)),
      )
    }),
  )
}

function toTicket(
  entry: repo.QueueRow,
  sameDoctor: repo.QueueRow[],
  doctorName: string,
  minutes: number,
): Ticket {
  const ahead = sameDoctor.filter(
    (row) =>
      inQueue(row.queueStatus) &&
      row.queueNumber !== null &&
      entry.queueNumber !== null &&
      row.queueNumber < entry.queueNumber,
  ).length

  return {
    id: entry.id,
    number: entry.queueNumber ?? 0,
    ahead,
    status: entry.queueStatus as QueueStatus,
    doctorName,
    waitMinutes: ahead * minutes,
  }
}

// ────────────────────────  Kabinetdagi navbat  ────────────────────────
//
// Bu yerda, ochiq sahifadan farqli oʻlaroq, ismlar koʻrinadi: roʻyxatni
// faqat klinika xodimi ochadi (`queue.manage`).

export interface QueueEntry {
  id: string
  number: number
  status: QueueStatus
  /// Kartotekadagi ism, boʻlmasa oʻzi yozgani
  fio: string
  phone: string | null
  patientId: string | null
  doctorId: string | null
  doctorName: string
  at: Date
}

async function entries(tx: ClinicTx): Promise<QueueEntry[]> {
  const { from, to } = today()
  const [rows, doctors] = await Promise.all([repo.queueOfDay(tx, from, to), auth.listDoctorsTx(tx)])
  const doctorName = new Map(doctors.map((doctor) => [doctor.id, doctor.fullName]))

  const ids = rows.map((row) => row.patientId).filter((id): id is string => id !== null)
  const people = await patients.findByIds(tx, [...new Set(ids)])
  const byId = new Map(people.map((person) => [person.id, person]))

  return rows.map((row) => {
    const person = row.patientId ? byId.get(row.patientId) : undefined
    return {
      id: row.id,
      number: row.queueNumber ?? 0,
      status: row.queueStatus as QueueStatus,
      fio: person?.fio ?? row.guestName ?? '',
      phone: person?.phone ?? row.guestPhone ?? null,
      patientId: row.patientId,
      doctorId: row.doctorId,
      doctorName: row.doctorId ? (doctorName.get(row.doctorId) ?? '') : '',
      at: row.at,
    }
  })
}

export function list(deps: QueueDeps, clinicId: string): Promise<QueueEntry[]> {
  return withClinic(deps.db, clinicId, (tx) => entries(tx))
}

/// Amal → yangi navbat holati va qabul natijasi.
///
/// `queue_status` navbatdagi oʻrinni, `status` esa qabul natijasini
/// saqlaydi (tz.md 14-boʻlim, 4.1 dagi qaror)
const FLOW: Record<
  QueueStatusInput['action'],
  { from: QueueStatus[]; queueStatus: QueueStatus; status?: 'arrived' | 'no_show' | 'done' }
> = {
  confirm: { from: ['unconfirmed'], queueStatus: 'waiting' },
  call: { from: ['waiting'], queueStatus: 'called' },
  arrived: { from: ['called'], queueStatus: 'finished', status: 'arrived' },
  no_show: { from: ['waiting', 'called'], queueStatus: 'finished', status: 'no_show' },
  done: { from: ['called'], queueStatus: 'finished', status: 'done' },
}

export function act(
  deps: QueueDeps,
  clinicId: string,
  userId: string,
  id: string,
  input: QueueStatusInput,
): Promise<QueueEntry[]> {
  const step = FLOW[input.action]

  return withClinic(deps.db, clinicId, async (tx) => {
    const entry = await repo.findQueueEntry(tx, id)
    if (!entry || entry.queueStatus === null) throw errors.notFound(QUEUE_TEXT.ticket_not_found)
    if (!step.from.includes(entry.queueStatus)) throw errors.badRequest(QUEUE_TEXT.status_flow)

    // Tasdiqlashda kartoteka bilan bogʻlanadi: telefon boʻyicha topiladi,
    // topilmasa yangi bemor ochiladi (tz.md 14-boʻlim)
    let patientId = entry.patientId
    if (input.action === 'confirm' && !patientId) {
      const phone = normalizePhone(entry.guestPhone)
      const existing = phone ? await patients.findByPhoneTx(tx, phone) : null
      patientId = existing
        ? existing.id
        : (
            await patients.createFromQueueTx(tx, userId, {
              fio: entry.guestName ?? '',
              phone,
            })
          ).id
    }

    await repo.updateQueueEntry(tx, id, {
      queueStatus: step.queueStatus,
      ...(step.status ? { status: step.status } : {}),
      ...(patientId !== entry.patientId
        ? { patient: { connect: { id: patientId as string } } }
        : {}),
    })

    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.queue_changed,
      entity: 'appointment',
      entityId: id,
      meta: { action: input.action },
    })

    // Ochiq sahifa va kutish xonasi ekrani darhol yangilansin
    await deps.bus.publish(queueChannel(clinicId))

    return entries(tx)
  })
}
