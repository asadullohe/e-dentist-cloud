// Bemor fikrlari (tz.md 14-boʻlim, 12-bosqich). Ochiq sahifadan keladi,
// faqat egasiga (yoki `feedback.own` bilan shifokorga — oʻzi haqida)
// koʻrinadi. Navbat raqamiga bogʻlangan fikr shifokor va bemorni raqamdan
// oladi — `appointments` ga schedule modulining xizmati orqali murojaat

import { FEEDBACK_TEXT, QUEUE_TEXT } from '@e-dentist/shared'
import type { FeedbackSource, FeedbackStatus } from '../../../generated/prisma/client.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import type { ScopedViewer } from '../../platform/guards.js'
import type { RateLimiter } from '../../platform/rateLimit.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as auth from '../auth/service.js'
import * as clinics from '../clinics/service.js'
import * as queue from '../schedule/queue.js'
import type { FeedbackRow } from './repo.js'
import * as repo from './repo.js'
import type { FeedbackListInput, FeedbackSubmitInput } from './schema.js'

export interface FeedbackDeps {
  db: Db
  rateLimiter: RateLimiter
}

// Suiisteʼmoldan himoya — navbatdagi kabi: IP soatiga, qurilma kuniga
const IP_LIMIT = 10
const IP_WINDOW = 60 * 60
const DEVICE_LIMIT = 3
const DEVICE_WINDOW = 24 * 60 * 60

/// Ochiq sahifa koʻradigan narsa: klinika, shifokorlar, sharh havolasi
export interface FeedbackPage {
  clinicName: string
  hasLogo: boolean
  reviewUrl: string | null
  doctors: { id: string; fullName: string }[]
}

export interface Feedback {
  id: string
  doctorId: string | null
  doctorName: string | null
  patientId: string | null
  rating: number
  tags: string[]
  comment: string | null
  phone: string | null
  source: FeedbackSource
  status: FeedbackStatus
  createdAt: string
}

export interface FeedbackSummary {
  count: number
  /// Bir xonali kasr; fikr boʻlmasa null
  average: number | null
  newCount: number
  byDoctor: { doctorId: string | null; doctorName: string | null; count: number; average: number }[]
}

async function findClinic(deps: FeedbackDeps, code: string) {
  // Navbat oʻchirilgan boʻlsa ham fikr yoziladi — bu alohida xizmat
  const clinic = await clinics.findByQueueCode(deps.db, code)
  if (!clinic) throw errors.notFound(QUEUE_TEXT.clinic_not_found)
  return clinic
}

export function page(deps: FeedbackDeps, code: string): Promise<FeedbackPage> {
  return findClinic(deps, code).then((clinic) =>
    withClinic(deps.db, clinic.id, async (tx) => ({
      clinicName: clinic.name,
      hasLogo: clinic.logo_key !== null,
      reviewUrl: clinic.review_url,
      doctors: await auth.listDoctorsTx(tx),
    })),
  )
}

/// Bemorga qaytadigan javob ataylab tor: nima yozgani va sharh havolasi
export async function submit(
  deps: FeedbackDeps,
  code: string,
  input: FeedbackSubmitInput,
  who: { ip: string; deviceId: string },
): Promise<{ id: string; rating: number; reviewUrl: string | null }> {
  const clinic = await findClinic(deps, code)

  const byIp = await deps.rateLimiter.hit(`feedback:ip:${who.ip}`, IP_LIMIT, IP_WINDOW)
  if (!byIp.allowed) throw errors.rateLimited(FEEDBACK_TEXT.too_many)
  const byDevice = await deps.rateLimiter.hit(
    `feedback:device:${who.deviceId}`,
    DEVICE_LIMIT,
    DEVICE_WINDOW,
  )
  if (!byDevice.allowed) throw errors.rateLimited(FEEDBACK_TEXT.too_many)

  return withClinic(deps.db, clinic.id, async (tx) => {
    let doctorId = input.doctorId
    let patientId: string | null = null
    let appointmentId: string | null = null
    let source: FeedbackSource = input.source

    if (input.ticketId) {
      const ticket = await queue.ticketForFeedback(tx, input.ticketId)
      if (!ticket) throw errors.notFound(QUEUE_TEXT.ticket_not_found)
      if (!ticket.finished) throw errors.badRequest(FEEDBACK_TEXT.ticket_not_finished)
      if (await repo.existsForAppointment(tx, input.ticketId)) {
        throw errors.conflict(FEEDBACK_TEXT.ticket_already)
      }
      doctorId = ticket.doctorId
      patientId = ticket.patientId
      appointmentId = input.ticketId
      source = 'ticket'
    } else if (doctorId) {
      const doctors = await auth.listDoctorsTx(tx)
      if (!doctors.some((doctor) => doctor.id === doctorId)) {
        throw errors.notFound(QUEUE_TEXT.doctor_not_found)
      }
    }

    const created = await repo.create(tx, uuidV7(), {
      doctorId,
      appointmentId,
      patientId,
      rating: input.rating,
      tags: input.tags,
      comment: input.comment,
      phone: input.phone,
      source,
      deviceId: who.deviceId,
    })
    return { id: created.id, rating: created.rating, reviewUrl: clinic.review_url }
  })
}

// ─────────────────────────  Kabinet  ─────────────────────────

/// `feedback.read` boʻlmasa (`feedback.own`) — faqat oʻzi haqidagi fikrlar
function scope(viewer: ScopedViewer): string | undefined {
  return viewer.all ? undefined : viewer.userId
}

async function toApi(tx: ClinicTx, rows: FeedbackRow[]): Promise<Feedback[]> {
  const ids = [...new Set(rows.map((row) => row.doctorId).filter((id): id is string => !!id))]
  const names = ids.length ? await auth.staffNamesTx(tx, ids) : new Map<string, string>()
  return rows.map((row) => ({
    id: row.id,
    doctorId: row.doctorId,
    doctorName: row.doctorId ? (names.get(row.doctorId) ?? null) : null,
    patientId: row.patientId,
    rating: row.rating,
    tags: row.tags,
    comment: row.comment,
    phone: row.phone,
    source: row.source,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }))
}

export function list(
  deps: FeedbackDeps,
  clinicId: string,
  viewer: ScopedViewer,
  input: FeedbackListInput,
): Promise<{ items: Feedback[]; total: number }> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const own = scope(viewer)
    const { items, total } = await repo.list(
      tx,
      {
        status: input.status,
        low: input.low,
        // Shifokor oʻz doirasidan chiqa olmaydi — filtr uniki bilan almashadi
        doctorId: own ?? input.doctorId,
      },
      input.page,
      input.pageSize,
    )
    return { items: await toApi(tx, items), total }
  })
}

export function setStatus(
  deps: FeedbackDeps,
  clinicId: string,
  viewer: ScopedViewer,
  id: string,
  status: FeedbackStatus,
): Promise<Feedback> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const row = await repo.find(tx, id)
    const own = scope(viewer)
    // Boshqa shifokorning fikri — «yoʻq», «mumkin emas» emas
    if (!row || (own && row.doctorId !== own)) throw errors.notFound(FEEDBACK_TEXT.not_found)
    const updated = await repo.setStatus(tx, id, status)
    return (await toApi(tx, [updated]))[0] as Feedback
  })
}

/// Boshqa modul uchun (export): barcha fikrlar
export function exportRowsTx(tx: ClinicTx): Promise<FeedbackRow[]> {
  return repo.all(tx)
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/// Oy chegaralari klinika kuni boʻyicha (jarayon TZ si Asia/Tashkent)
function monthRange(month: string): { from: Date; to: Date } {
  const [year, index] = month.split('-').map(Number) as [number, number]
  return { from: new Date(year, index - 1, 1), to: new Date(year, index, 1) }
}

export function summary(
  deps: FeedbackDeps,
  clinicId: string,
  viewer: ScopedViewer,
  month?: string,
): Promise<FeedbackSummary> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const own = scope(viewer)
    const range = month ? monthRange(month) : undefined
    const [groups, newCount] = await Promise.all([
      repo.totalsByDoctor(tx, range?.from, range?.to, own),
      repo.countNew(tx, own),
    ])
    const ids = groups.map((g) => g.doctorId).filter((id): id is string => !!id)
    const names = ids.length ? await auth.staffNamesTx(tx, ids) : new Map<string, string>()

    let count = 0
    let sum = 0
    const byDoctor = groups.map((g) => {
      const n = g._count._all
      const avg = g._avg.rating ?? 0
      count += n
      sum += avg * n
      return {
        doctorId: g.doctorId,
        doctorName: g.doctorId ? (names.get(g.doctorId) ?? null) : null,
        count: n,
        average: round1(avg),
      }
    })
    byDoctor.sort((a, b) => b.count - a.count)

    return { count, average: count ? round1(sum / count) : null, newCount, byDoctor }
  })
}
