// visits moduli `visits`, `teeth` va `bridges` jadvallariga egalik qiladi.

import type { Prisma } from '../../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const VISIT_SELECT = {
  id: true,
  patientId: true,
  doctorId: true,
  date: true,
  time: true,
  treatment: true,
  tooth: true,
  serviceId: true,
  price: true,
  labOrderId: true,
  labCost: true,
  note: true,
} satisfies Prisma.VisitSelect

const TOOTH_SELECT = {
  tooth: true,
  status: true,
  material: true,
  note: true,
} satisfies Prisma.ToothSelect

const BRIDGE_SELECT = {
  id: true,
  teeth: true,
  material: true,
} satisfies Prisma.BridgeSelect

/// `doctorId` berilsa — faqat shu shifokorning tashriflari (shifokor
/// boshqaning muolajasini koʻrmaydi)
export function listVisits(tx: ClinicTx, patientId: string, doctorId?: string) {
  return tx.visit.findMany({
    where: { patientId, ...(doctorId ? { doctorId } : {}) },
    select: VISIT_SELECT,
    // Yangi tashrif tepada. Bir kunda bir nechtasi boʻlsa — qabul vaqti
    // boʻyicha (vaqtsiz eski yozuvlar oxirida), keyin kiritilgan tartibda
    orderBy: [{ date: 'desc' }, { time: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
  })
}

/// Toʻlovni ishga bogʻlash uchun: bemorning tashriflari eng eskisidan
/// (sana, vaqt, kiritilish tartibi) — avtomat bogʻlash shu tartibda yopadi
export function forAllocation(tx: ClinicTx, patientId: string) {
  return tx.visit.findMany({
    where: { patientId },
    select: { id: true, date: true, treatment: true, price: true },
    orderBy: [{ date: 'asc' }, { time: { sort: 'asc', nulls: 'first' } }, { id: 'asc' }],
  })
}

export function summaries(tx: ClinicTx, ids: readonly string[]) {
  if (ids.length === 0) return Promise.resolve([])
  return tx.visit.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, date: true, treatment: true, tooth: true, price: true },
  })
}

/// Bemor boʻyicha tashriflar summasi. payments moduli qarzni shundan
/// hisoblaydi — u `visits` jadvaliga oʻzi murojaat qilmaydi
export async function chargeTotals(tx: ClinicTx): Promise<Map<string, number>> {
  const rows = await tx.visit.groupBy({ by: ['patientId'], _sum: { price: true } })
  return new Map(rows.map((row) => [row.patientId, row._sum.price ?? 0]))
}

export async function chargeTotalOf(tx: ClinicTx, patientId: string): Promise<number> {
  const row = await tx.visit.aggregate({ where: { patientId }, _sum: { price: true } })
  return row._sum.price ?? 0
}

export function createVisit(
  tx: ClinicTx,
  id: string,
  data: {
    patientId: string
    doctorId: string
    date: Date
    time: string | null
    treatment: string
    tooth?: number | null
    serviceId?: string | null
    price: number
    doctorPercent: number
    doctorShare: number
    labOrderId?: string | null
    labCost?: number
    note?: string | null
  },
) {
  return tx.visit.create({ data: tenantScoped({ id, ...data }), select: VISIT_SELECT })
}

/// Tahrir uchun: ulush maydonlari ham. Ular roʻyxat javobiga qoʻshilmaydi —
/// shifokorning foizi bemor kartochkasini koʻrgan har kimga koʻrinmasin
export function findVisit(tx: ClinicTx, id: string) {
  return tx.visit.findUnique({
    where: { id },
    select: { ...VISIT_SELECT, doctorPercent: true, doctorShare: true },
  })
}

export function updateVisit(tx: ClinicTx, id: string, data: Prisma.VisitUpdateInput) {
  return tx.visit.update({ where: { id }, data, select: VISIT_SELECT })
}

export function removeVisit(tx: ClinicTx, id: string) {
  return tx.visit.delete({ where: { id } })
}

/// Bemorning butun tish xaritasi: tishlar va koʻpriklar birga
export async function chart(tx: ClinicTx, patientId: string) {
  const [teeth, bridges] = await Promise.all([
    tx.tooth.findMany({ where: { patientId }, select: TOOTH_SELECT, orderBy: { tooth: 'asc' } }),
    tx.bridge.findMany({ where: { patientId }, select: BRIDGE_SELECT }),
  ])
  return { teeth, bridges }
}

/// Tishning holati birinchi marta belgilanayotgan boʻlishi ham mumkin,
/// shuning uchun upsert
export function setTooth(
  tx: ClinicTx,
  id: string,
  patientId: string,
  tooth: number,
  data: { status: string; material?: string | null; note?: string | null },
) {
  return tx.tooth.upsert({
    where: { patientId_tooth: { patientId, tooth } },
    create: tenantScoped({ id, patientId, tooth, ...data }),
    update: data,
    select: TOOTH_SELECT,
  })
}

/// «Sogʻlom» — sukut holati. Izoh va material ham boʻlmasa, qatorni saqlashning
/// maʼnosi yoʻq: xarita baribir shunday chiziladi
export function clearTooth(tx: ClinicTx, patientId: string, tooth: number) {
  return tx.tooth.deleteMany({ where: { patientId, tooth } })
}

export function findBridge(tx: ClinicTx, id: string) {
  return tx.bridge.findUnique({ where: { id }, select: { ...BRIDGE_SELECT, patientId: true } })
}

export function createBridge(
  tx: ClinicTx,
  id: string,
  patientId: string,
  teeth: number[],
  material: string,
) {
  return tx.bridge.create({ data: tenantScoped({ id, patientId, teeth, material }) })
}

export function removeBridge(tx: ClinicTx, id: string) {
  return tx.bridge.delete({ where: { id } })
}

/// Kun boʻyicha jamlanma. Oyga yigʻish xizmat qatlamida: Prisma `groupBy`
/// oy kesimini bilmaydi, xom SQL esa ijarachi kengaytmasini chetlab oʻtadi.
/// Bir yilda koʻpi bilan 366 qator qaytadi
export function dailyTotals(tx: ClinicTx, from: Date, to: Date) {
  return tx.visit.groupBy({
    by: ['date'],
    where: { date: { gte: from, lte: to } },
    _sum: { price: true },
    _count: { _all: true },
  })
}

/// Oy ichida eng koʻp pul kelgan muolajalar
export function topTreatments(tx: ClinicTx, from: Date, to: Date, take: number) {
  return tx.visit.groupBy({
    by: ['treatment'],
    where: { date: { gte: from, lte: to } },
    _sum: { price: true },
    _count: { _all: true },
    orderBy: { _sum: { price: 'desc' } },
    take,
  })
}

/// Eng birinchi tashrif sanasi — eksportda oylar oraligʻi shundan boshlanadi
export async function firstDate(tx: ClinicTx): Promise<Date | null> {
  const row = await tx.visit.aggregate({ _min: { date: true } })
  return row._min.date
}

/// Ish haqi uchun: oy ichida shifokor boʻyicha jamlanma. `doctorId` null —
/// Oydagi hamma tashriflar — ish haqi hisobi tashrif darajasida (olingan
/// qism har tashrifda alohida)
export function listByMonth(tx: ClinicTx, from: Date, to: Date) {
  return tx.visit.findMany({
    where: { date: { gte: from, lte: to } },
    select: { id: true, doctorId: true, price: true, labCost: true, doctorShare: true },
  })
}

/// Shifokorning oydagi ishlari roʻyxati — ulushi bilan
export function listByDoctor(tx: ClinicTx, doctorId: string, from: Date, to: Date) {
  return tx.visit.findMany({
    where: { doctorId, date: { gte: from, lte: to } },
    select: {
      id: true,
      patientId: true,
      date: true,
      time: true,
      treatment: true,
      tooth: true,
      price: true,
      labCost: true,
      doctorPercent: true,
      doctorShare: true,
    },
    orderBy: [{ date: 'desc' }, { time: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
  })
}

/// Qayta hisoblash: oydagi tashriflarga bitta foizni yozadi. Prisma da
/// `share = price × p` ni bitta UPDATE bilan yozib boʻlmaydi — qatorlar
/// olinib, har biriga alohida yoziladi; oyga bir shifokorda yuzlab qator
export async function setSharesByDoctor(
  tx: ClinicTx,
  doctorId: string,
  from: Date,
  to: Date,
  shareFor: (price: number, labCost: number) => number,
  percent: number,
): Promise<number> {
  const rows = await tx.visit.findMany({
    where: { doctorId, date: { gte: from, lte: to } },
    select: { id: true, price: true, labCost: true },
  })
  for (const row of rows) {
    await tx.visit.update({
      where: { id: row.id },
      data: { doctorPercent: percent, doctorShare: shareFor(row.price, row.labCost) },
    })
  }
  return rows.length
}

/// Toʻliq eksport uchun: klinikaning barcha tashriflari, tishlari, koʻpriklari
export function allVisits(tx: ClinicTx) {
  return tx.visit.findMany({
    select: { ...VISIT_SELECT, createdAt: true },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  })
}

export function allTeeth(tx: ClinicTx) {
  return tx.tooth.findMany({
    select: { patientId: true, ...TOOTH_SELECT },
    orderBy: [{ patientId: 'asc' }, { tooth: 'asc' }],
  })
}

export function allBridges(tx: ClinicTx) {
  return tx.bridge.findMany({
    select: { patientId: true, ...BRIDGE_SELECT },
    orderBy: { patientId: 'asc' },
  })
}
