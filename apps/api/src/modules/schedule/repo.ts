// schedule moduli `appointments` jadvaliga egalik qiladi.

import type { Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

// Bemor nomi bu yerda olinmaydi: `patients` boshqa modulning jadvali.
// Uni service qatlamida patients.findByIds orqali qoʻshamiz — qarzdorlar
// roʻyxatidagi kabi (tz.md 2-boʻlim: modul chegarasi)
const SELECT = {
  id: true,
  patientId: true,
  at: true,
  status: true,
  note: true,
  /// Navbatga ochiq sahifadan yozilgan, kartotekada hali yoʻq odam
  guestName: true,
  guestPhone: true,
} satisfies Prisma.AppointmentSelect

export function list(tx: ClinicTx, from: Date, to: Date) {
  return tx.appointment.findMany({
    where: { at: { gte: from, lt: to } },
    select: SELECT,
    orderBy: { at: 'asc' },
  })
}

export function findById(tx: ClinicTx, id: string) {
  return tx.appointment.findUnique({ where: { id }, select: SELECT })
}

export function create(
  tx: ClinicTx,
  id: string,
  data: { patientId: string; at: Date; note?: string | null },
) {
  return tx.appointment.create({ data: tenantScoped({ id, ...data }), select: SELECT })
}

export function update(tx: ClinicTx, id: string, data: Prisma.AppointmentUpdateInput) {
  return tx.appointment.update({ where: { id }, data, select: SELECT })
}

export function remove(tx: ClinicTx, id: string) {
  return tx.appointment.delete({ where: { id } })
}

/// Toʻliq eksport uchun
export function allAppointments(tx: ClinicTx) {
  return tx.appointment.findMany({ select: SELECT, orderBy: [{ at: 'asc' }, { id: 'asc' }] })
}

// ─────────────────────────────  Navbat  ─────────────────────────────

const QUEUE_SELECT = {
  id: true,
  patientId: true,
  doctorId: true,
  at: true,
  status: true,
  note: true,
  queueNumber: true,
  queueStatus: true,
  guestName: true,
  guestPhone: true,
} satisfies Prisma.AppointmentSelect

export type QueueRow = Prisma.AppointmentGetPayload<{ select: typeof QUEUE_SELECT }>

/// Bugungi navbat. Tartib: raqam boʻyicha
export function queueOfDay(tx: ClinicTx, from: Date, to: Date, doctorId?: string) {
  return tx.appointment.findMany({
    where: {
      queueStatus: { not: null },
      at: { gte: from, lte: to },
      ...(doctorId ? { doctorId } : {}),
    },
    select: QUEUE_SELECT,
    orderBy: [{ queueNumber: 'asc' }],
  })
}

export function findQueueEntry(tx: ClinicTx, id: string) {
  return tx.appointment.findUnique({ where: { id }, select: QUEUE_SELECT })
}

export function createQueueEntry(
  tx: ClinicTx,
  id: string,
  data: {
    doctorId: string
    at: Date
    queueNumber: number
    queueStatus: 'unconfirmed' | 'waiting'
    guestName: string
    guestPhone: string | null
    patientId: string | null
  },
) {
  return tx.appointment.create({ data: tenantScoped({ id, ...data }), select: QUEUE_SELECT })
}

export function updateQueueEntry(tx: ClinicTx, id: string, data: Prisma.AppointmentUpdateInput) {
  return tx.appointment.update({ where: { id }, data, select: QUEUE_SELECT })
}

/// Kunning eng katta raqami. Yangi yozuv shundan keyingisini oladi
export async function lastQueueNumber(tx: ClinicTx, from: Date, to: Date): Promise<number> {
  const row = await tx.appointment.aggregate({
    where: { at: { gte: from, lte: to }, queueStatus: { not: null } },
    _max: { queueNumber: true },
  })
  return row._max.queueNumber ?? 0
}

/// Bitta klinika ichida raqam berishni ketma-ket qilamiz: ikkita odam bir
/// vaqtda yozilsa ikkalasiga bitta raqam tegib qolmasin. Tranzaksiya
/// tugashi bilan qulf oʻzi boʻshaydi
export async function lockQueueNumbering(tx: ClinicTx, clinicId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`queue:${clinicId}`}))`
}

/// Oxirgi yakunlangan navbatlarning tugash vaqtlari — taxminiy kutish
/// vaqtini shundan hisoblaymiz
export function recentlyFinished(tx: ClinicTx, take: number) {
  return tx.appointment.findMany({
    where: { queueStatus: 'finished' },
    select: { updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take,
  })
}
