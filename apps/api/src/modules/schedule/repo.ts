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
