// patients moduli `patients` jadvaliga egalik qiladi.
// clinicId ni kengaytma oʻzi qoʻyadi — bu yerda hech qayerda yozilmaydi.

import { phoneDigits, searchKey, todayISO } from '@e-dentist/shared'
import type { Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const SELECT = {
  id: true,
  fio: true,
  phone: true,
  birthDate: true,
  address: true,
  note: true,
  doctorId: true,
  createdAt: true,
} satisfies Prisma.PatientSelect

export interface PatientFields {
  fio?: string | undefined
  phone?: string | null | undefined
  birthDate?: Date | null | undefined
  address?: string | null | undefined
  note?: string | null | undefined
  doctorId?: string | null | undefined
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

/// Bugundan N yil oldingi sana (UTC yarim tun — DATE ustuni bilan bir xil)
function yearsAgo(years: number): Date {
  const [y, m, d] = todayISO().split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y - years, m - 1, d))
}

/// Ustun filtrlari: har biri oʻz ustunida, umumiy qidiruv bilan AND
function columnWhere(input: {
  fio?: string
  phone?: string
  address?: string
  doctorId?: string
  ageFrom?: number
  ageTo?: number
}) {
  const and: Prisma.PatientWhereInput[] = []
  if (input.doctorId) and.push({ doctorId: input.doctorId })
  // Yosh ≥ N: tugʻilgan sana N yil oldingi kundan kech emas.
  // Yosh ≤ M: (M+1) yil oldingi kundan keyin tugʻilgan
  if (input.ageFrom !== undefined) and.push({ birthDate: { lte: yearsAgo(input.ageFrom) } })
  if (input.ageTo !== undefined) and.push({ birthDate: { gt: yearsAgo(input.ageTo + 1) } })
  if (input.fio?.trim()) and.push({ fioSearch: { contains: searchKey(input.fio) } })
  if (input.phone?.trim()) {
    const digits = phoneDigits(input.phone)
    // Raqam yozilmagan boʻlsa (masalan «+998») hech narsa filtrlanmaydi
    if (digits) and.push({ phone: { contains: digits } })
  }
  if (input.address?.trim()) {
    and.push({ address: { contains: input.address.trim(), mode: 'insensitive' } })
  }
  return and
}

export async function list(
  tx: ClinicTx,
  input: {
    q?: string
    fio?: string
    phone?: string
    address?: string
    doctorId?: string
    ageFrom?: number
    ageTo?: number
    page: number
    pageSize: number
    sort: 'fio' | 'birthDate' | 'createdAt'
    dir: 'asc' | 'desc'
  },
) {
  const where: Prisma.PatientWhereInput = { AND: [searchWhere(input.q), ...columnWhere(input)] }
  const [items, total] = await Promise.all([
    tx.patient.findMany({
      where,
      select: SELECT,
      // Ikkinchi kalit — id: bir xil qiymatlarda sahifalar orasida qator
      // sakrab yurmasin
      orderBy: [{ [input.sort]: input.dir }, { id: 'asc' }],
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

/// Excel ga chiqarish uchun — sahifalashsiz, toʻliq roʻyxat
/// Takrorlarni aniqlash uchun: telefon → bemor id. Telefon takrorlanishi
/// mumkin, birinchisi olinadi
export async function phoneIndex(tx: ClinicTx): Promise<Map<string, string>> {
  const rows = await tx.patient.findMany({
    where: { phone: { not: null } },
    select: { id: true, phone: true },
  })
  const index = new Map<string, string>()
  for (const row of rows) {
    if (row.phone && !index.has(row.phone)) index.set(row.phone, row.id)
  }
  return index
}

export async function existingIds(tx: ClinicTx, ids: string[]): Promise<Set<string>> {
  const rows = await tx.patient.findMany({ where: { id: { in: ids } }, select: { id: true } })
  return new Set(rows.map((row) => row.id))
}

export function listAll(tx: ClinicTx) {
  return tx.patient.findMany({
    select: { id: true, fio: true, phone: true, birthDate: true, address: true, note: true },
    orderBy: { fio: 'asc' },
  })
}

/// Qidiruvga mos bemorlar id si — boshqa modul oʻz roʻyxatini shu bilan
/// filtrlaydi (qarzdorlar). Klinikada bemorlar mingdan oshmaydi
export async function searchIds(tx: ClinicTx, query: string): Promise<Set<string>> {
  const rows = await tx.patient.findMany({ where: searchWhere(query), select: { id: true } })
  return new Set(rows.map((row) => row.id))
}

export function findByIds(tx: ClinicTx, ids: string[]) {
  return tx.patient.findMany({
    where: { id: { in: ids } },
    select: { id: true, fio: true, phone: true },
  })
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

/// Oraliqda qoʻshilgan bemorlar soni. Hisobot uchun
export function countCreatedBetween(tx: ClinicTx, from: Date, to: Date) {
  return tx.patient.count({ where: { createdAt: { gte: from, lt: to } } })
}

/// Telefon boʻyicha bitta bemor. Navbatni kartoteka bilan bogʻlashda
export function findByPhone(tx: ClinicTx, phone: string) {
  return tx.patient.findFirst({ where: { phone }, select: { id: true, fio: true, phone: true } })
}
