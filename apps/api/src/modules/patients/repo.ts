// patients moduli `patients` jadvaliga egalik qiladi.
// clinicId ni kengaytma oʻzi qoʻyadi — bu yerda hech qayerda yozilmaydi.

import { phoneDigits, searchKey } from '@e-dentist/shared'
import type { Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const SELECT = {
  id: true,
  fio: true,
  phone: true,
  birthDate: true,
  address: true,
  note: true,
  createdAt: true,
} satisfies Prisma.PatientSelect

export interface PatientFields {
  fio?: string | undefined
  phone?: string | null | undefined
  birthDate?: Date | null | undefined
  address?: string | null | undefined
  note?: string | null | undefined
}

/// Qidiruv: ism boʻyicha normallashtirilgan ustundan, telefon boʻyicha
/// raqamlardan. «karimov» kabi matnda raqam yoʻq — u holda telefon shartisiz
function searchWhere(query: string | undefined): Prisma.PatientWhereInput {
  const text = query?.trim()
  if (!text) return {}

  const digits = phoneDigits(text)
  const or: Prisma.PatientWhereInput[] = [{ fioSearch: { contains: searchKey(text) } }]
  if (digits.length >= 3) or.push({ phone: { contains: digits } })
  return { OR: or }
}

export async function list(tx: ClinicTx, input: { q?: string; page: number; pageSize: number }) {
  const where = searchWhere(input.q)
  const [items, total] = await Promise.all([
    tx.patient.findMany({
      where,
      select: SELECT,
      orderBy: { fio: 'asc' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    tx.patient.count({ where }),
  ])
  return { items, total }
}

export async function exists(tx: ClinicTx, id: string): Promise<boolean> {
  return (await tx.patient.count({ where: { id } })) > 0
}

export function findById(tx: ClinicTx, id: string) {
  return tx.patient.findUnique({ where: { id }, select: SELECT })
}

export function create(tx: ClinicTx, id: string, fields: PatientFields & { fio: string }) {
  return tx.patient.create({
    data: tenantScoped({ id, ...fields, fioSearch: searchKey(fields.fio) }),
    select: SELECT,
  })
}

export function update(tx: ClinicTx, id: string, fields: PatientFields) {
  return tx.patient.update({
    where: { id },
    data: {
      ...fields,
      ...(fields.fio === undefined ? {} : { fioSearch: searchKey(fields.fio) }),
    },
    select: SELECT,
  })
}

export function remove(tx: ClinicTx, id: string) {
  return tx.patient.delete({ where: { id } })
}

const IMAGE_SELECT = {
  id: true,
  key: true,
  caption: true,
  createdAt: true,
} satisfies Prisma.PatientImageSelect

export function listImages(tx: ClinicTx, patientId: string) {
  return tx.patientImage.findMany({
    where: { patientId },
    select: IMAGE_SELECT,
    orderBy: { id: 'desc' },
  })
}

export function createImage(
  tx: ClinicTx,
  id: string,
  patientId: string,
  key: string,
  caption: string | null,
) {
  return tx.patientImage.create({
    data: tenantScoped({ id, patientId, key, caption }),
    select: IMAGE_SELECT,
  })
}

export function findImage(tx: ClinicTx, id: string) {
  return tx.patientImage.findUnique({ where: { id }, select: IMAGE_SELECT })
}

export function removeImage(tx: ClinicTx, id: string) {
  return tx.patientImage.delete({ where: { id } })
}
