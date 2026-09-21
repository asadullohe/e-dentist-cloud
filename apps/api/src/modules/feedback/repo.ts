// feedback moduli `feedback` jadvaliga egalik qiladi.

import type { FeedbackStatus, Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const FEEDBACK_SELECT = {
  id: true,
  doctorId: true,
  appointmentId: true,
  patientId: true,
  rating: true,
  tags: true,
  comment: true,
  phone: true,
  source: true,
  status: true,
  createdAt: true,
} satisfies Prisma.FeedbackSelect

export type FeedbackRow = Prisma.FeedbackGetPayload<{ select: typeof FEEDBACK_SELECT }>

export interface ListFilter {
  status?: FeedbackStatus
  low?: boolean
  /// `null` — shifokorsiz fikrlar ham kiradi; satr — faqat shu shifokor
  doctorId?: string
}

function whereOf(filter: ListFilter): Prisma.FeedbackWhereInput {
  return {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.low ? { rating: { lte: 2 } } : {}),
    ...(filter.doctorId ? { doctorId: filter.doctorId } : {}),
  }
}

export async function list(tx: ClinicTx, filter: ListFilter, page: number, pageSize: number) {
  const where = whereOf(filter)
  const [items, total] = await Promise.all([
    tx.feedback.findMany({
      where,
      select: FEEDBACK_SELECT,
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    tx.feedback.count({ where }),
  ])
  return { items, total }
}

export function find(tx: ClinicTx, id: string) {
  return tx.feedback.findUnique({ where: { id }, select: FEEDBACK_SELECT })
}

export function create(
  tx: ClinicTx,
  id: string,
  data: {
    doctorId: string | null
    appointmentId: string | null
    patientId: string | null
    rating: number
    tags: string[]
    comment: string | null
    phone: string | null
    source: 'ticket' | 'qr' | 'page'
    deviceId: string | null
  },
) {
  return tx.feedback.create({ data: tenantScoped({ id, ...data }), select: FEEDBACK_SELECT })
}

export function setStatus(tx: ClinicTx, id: string, status: FeedbackStatus) {
  return tx.feedback.update({ where: { id }, data: { status }, select: FEEDBACK_SELECT })
}

/// Navbat raqamiga fikr yozilganmi
export async function existsForAppointment(tx: ClinicTx, appointmentId: string) {
  const row = await tx.feedback.findUnique({ where: { appointmentId }, select: { id: true } })
  return row !== null
}

/// Oy ichida (yoki umuman) shifokor boʻyicha jamlanma
export function totalsByDoctor(tx: ClinicTx, from?: Date, to?: Date, doctorId?: string) {
  return tx.feedback.groupBy({
    by: ['doctorId'],
    where: {
      ...(from && to ? { createdAt: { gte: from, lt: to } } : {}),
      ...(doctorId ? { doctorId } : {}),
    },
    _avg: { rating: true },
    _count: { _all: true },
  })
}

/// Toʻliq eksport uchun: klinikaning barcha fikrlari
export function all(tx: ClinicTx) {
  return tx.feedback.findMany({ select: FEEDBACK_SELECT, orderBy: [{ createdAt: 'asc' }] })
}

export function countNew(tx: ClinicTx, doctorId?: string) {
  return tx.feedback.count({ where: { status: 'new', ...(doctorId ? { doctorId } : {}) } })
}
