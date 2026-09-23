// Tashriflar va tish xaritasi mantigʻi.

import { formatSom, PATIENT_TEXT, VISIT_TEXT } from '@e-dentist/shared'
import { bridgeSpan } from '@e-dentist/teeth'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import type { ScopedViewer } from '../../platform/guards.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as auth from '../auth/service.js'
import * as patients from '../patients/service.js'
import * as services from '../services/service.js'
import * as repo from './repo.js'
import type {
  BridgeCreateInput,
  ToothUpdateInput,
  VisitCreateInput,
  VisitUpdateInput,
} from './schema.js'

export interface VisitDeps {
  db: Db
  /// Tashrifga olingan summa (payments moduli beradi — u bu modulni import
  /// qiladi, shuning uchun aylanma import oʻrniga server yigʻilganda beriladi).
  /// Berilmasa narxni kamaytirishda tekshiruv yoʻq
  paidOfVisit?: (tx: ClinicTx, visitId: string) => Promise<number>
  /// Roʻyxatda har tashrifga «olingan» — payments dan; berilmasa 0
  paidByVisits?: (tx: ClinicTx, visitIds: readonly string[]) => Promise<Map<string, number>>
}

/// Boshqa modullar uchun (payments): bemorning tashriflari — toʻlovni ishga
/// bogʻlash uchun kerak boʻlgan maydonlar, eng eskisidan
export function forAllocationTx(tx: ClinicTx, patientId: string) {
  return repo.forAllocation(tx, patientId)
}

/// Boshqa modullar uchun (payments, payroll): id boʻyicha qisqa maʼlumot
export function summariesTx(tx: ClinicTx, ids: readonly string[]) {
  return repo.summaries(tx, ids)
}

/// Boshqa modullar uchun (schedule): tashrif maydonlarining sxemasi —
/// qabulni yakunlash formasi ham shu maydonlarni oladi
export { visitCreateSchema } from './schema.js'

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

/// Vaqt berilmasa — kiritilayotgan lahza, klinika soati boʻyicha
function nowTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025'
  )
}

/// Bemor shu klinikaniki ekanini tasdiqlaydi. Tashqi kalit tekshiruvi RLS ni
/// chetlab oʻtadi, shuning uchun bu tekshiruvsiz begona bemorga yozuv
/// bogʻlab qoʻyish mumkin boʻlardi
/// Bemor shu klinikaniki va shu koʻruvchiga koʻrinadi. Shifokor
/// (patients.all yoʻq) boshqaning bemoriga tashrif yozolmaydi — u uchun
/// bemor «topilmadi» (tz.md 14-boʻlim)
async function assertPatient(tx: ClinicTx, viewer: ScopedViewer, patientId: string): Promise<void> {
  if (!(await patients.isVisibleTx(tx, viewer, patientId))) {
    throw errors.notFound(PATIENT_TEXT.not_found)
  }
}

/// Boshqa modullar uchun (payments): tashriflar summasi.
/// Ochiq tranzaksiya ichida ishlaydi — chaqiruvchi sessiyani oʻzi ochadi
export function chargeTotals(tx: ClinicTx) {
  return repo.chargeTotals(tx)
}

export function chargeTotalOf(tx: ClinicTx, patientId: string) {
  return repo.chargeTotalOf(tx, patientId)
}

/// Boshqa modullar uchun (reports): kun boʻyicha tashrif soni va summasi
export async function dailyTotalsTx(
  tx: ClinicTx,
  from: Date,
  to: Date,
): Promise<{ date: Date; total: number; count: number }[]> {
  const rows = await repo.dailyTotals(tx, from, to)
  return rows.map((row) => ({
    date: row.date,
    total: row._sum.price ?? 0,
    count: row._count._all,
  }))
}

/// Boshqa modullar uchun (payroll): eng birinchi tashrif sanasi
export function firstDateTx(tx: ClinicTx): Promise<Date | null> {
  return repo.firstDate(tx)
}

/// Boshqa modullar uchun (payroll): oydagi hamma tashriflar, qisqa
export function listByMonthTx(tx: ClinicTx, from: Date, to: Date) {
  return repo.listByMonth(tx, from, to)
}

/// Boshqa modullar uchun (payroll): shifokorning oydagi ishlari
export function listByDoctorTx(tx: ClinicTx, doctorId: string, from: Date, to: Date) {
  return repo.listByDoctor(tx, doctorId, from, to)
}

/// Boshqa modullar uchun (payroll): oydagi tashriflarga joriy foizni qayta
/// yozish. Snapshot qoidasidan ataylab chekinish — aniq amal, audit bilan
export function recalculateSharesTx(
  tx: ClinicTx,
  doctorId: string,
  from: Date,
  to: Date,
  percent: number,
): Promise<number> {
  return repo.setSharesByDoctor(
    tx,
    doctorId,
    from,
    to,
    (price, labCost) => shareOf(price, percent, labCost),
    percent,
  )
}

/// Boshqa modullar uchun (reports): oraliqdagi eng qimmat muolajalar
export async function topTreatmentsTx(
  tx: ClinicTx,
  from: Date,
  to: Date,
  take: number,
): Promise<{ treatment: string; count: number; total: number }[]> {
  const rows = await repo.topTreatments(tx, from, to, take)
  return rows.map((row) => ({
    treatment: row.treatment,
    count: row._count._all,
    total: row._sum.price ?? 0,
  }))
}

/// Shifokor ulushi: narx × foiz, butun soʻmga yaxlitlanadi (tz.md 15-boʻlim).
/// payroll moduli qayta hisoblashda ham shu formulani ishlatadi
/// Shifokor ulushi. Protez ishida texnik narxi avval ayiriladi: foiz
/// klinikaga qolgan puldan (qaror 19/09/2026). Texnik narxi ishdan qimmat
/// boʻlsa ulush nol — manfiy boʻlmaydi
export function shareOf(price: number, percent: number, labCost = 0): number {
  return Math.round((Math.max(0, price - labCost) * percent) / 100)
}

/// Shifokor faol va `visits.write` li xodim boʻlishi shart. Tashqi kalit
/// yoʻq — begona klinika xodimining id si shu tekshiruvsiz oʻtib ketardi
async function assertDoctor(tx: ClinicTx, doctorId: string): Promise<void> {
  if (!(await auth.isDoctorTx(tx, doctorId))) {
    throw errors.validation({ doctorId: VISIT_TEXT.doctor_not_found }, VISIT_TEXT.doctor_not_found)
  }
}

/// Javobga shifokor ismi qoʻshiladi — jadvalda id emas, ism koʻrinadi.
/// Eski yozuvda shifokor yoʻq (`null`)
async function withDoctorNames<T extends { doctorId: string | null }>(
  tx: ClinicTx,
  rows: T[],
): Promise<(T & { doctorName: string | null })[]> {
  const ids = [...new Set(rows.map((row) => row.doctorId).filter((id): id is string => !!id))]
  const names = await auth.staffNamesTx(tx, ids)
  return rows.map((row) => ({
    ...row,
    doctorName: row.doctorId ? (names.get(row.doctorId) ?? null) : null,
  }))
}

/// Kartochkadagi tashriflar. Shifokor faqat oʻzinikini koʻradi —
/// boshqa shifokorning muolajasi va narxi unga koʻrinmaydi
export function listVisits(
  deps: VisitDeps,
  clinicId: string,
  viewer: ScopedViewer,
  patientId: string,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, viewer, patientId)
    const rows = await repo.listVisits(tx, patientId, viewer.all ? undefined : viewer.userId)
    // Har tashrifda olingan summa — «olinmagan» kartochkada shundan
    const paid = deps.paidByVisits
      ? await deps.paidByVisits(
          tx,
          rows.map((row) => row.id),
        )
      : new Map<string, number>()
    const named = await withDoctorNames(tx, rows)
    return named.map((row) => ({ ...row, paid: paid.get(row.id) ?? 0 }))
  })
}

/// Tashrif yozish — ochiq tranzaksiya ichida. Boshqa modullar uchun ham
/// (schedule: qabul yakunlanganda tashrif shu yerdan yoziladi, bir
/// tranzaksiyada — tashrif yozilib, qabul yakunlanmay qolmasin)
/// Naryad bilan bogʻlanish: tashrif naryad topshirilganda yoziladi, texnik
/// narxi snapshot boʻlib ulushdan ayiriladi
export interface LabLink {
  labOrderId: string
  labCost: number
}

export async function createTx(
  tx: ClinicTx,
  viewer: ScopedViewer,
  input: VisitCreateInput,
  lab?: LabLink,
): Promise<VisitRow> {
  const { userId } = viewer
  const id = uuidV7()
  await assertPatient(tx, viewer, input.patientId)
  // Sukut — yozayotgan odamning oʻzi: u `visits.write` bilan kirgan,
  // demak shifokorlar roʻyxatida bor. Cheklangan koʻruvchi (shifokor)
  // faqat oʻz nomidan yozadi — aks holda oʻzi koʻrolmaydigan tashrif chiqardi
  const doctorId = viewer.all ? (input.doctorId ?? userId) : userId
  await assertDoctor(tx, doctorId)
  // Foiz shu paytda muzlatiladi — keyin oʻzgarsa bu tashrifga tegmaydi
  const { payPercent } = await auth.payTermsTx(tx, doctorId)

  // Tish xizmatning qoʻllanish sohasiga qarab (19-boʻlim): `mouth`/`arch` da
  // boʻsh yoziladi, `tooth`/`range` da majburiy. Xizmat tanlanmagan boʻlsa
  // (qoʻlda yozilgan muolaja) — ixtiyoriy
  const areas = await services.areasOfTx(tx, input.serviceId ? [input.serviceId] : [])
  const tooth = services.toothForArea(
    input.serviceId ? areas.get(input.serviceId) : undefined,
    input.tooth,
  )

  // Texnik narxi: naryaddan (topshirish), boʻlmasa formadan (xizmatdan
  // koʻchgan yoki qoʻlda) — ikkalasi ham snapshot
  const labCost = lab?.labCost ?? input.labCost ?? 0
  const visit = await repo.createVisit(tx, id, {
    patientId: input.patientId,
    doctorId,
    date: toDate(input.date),
    time: input.time ?? nowTime(),
    treatment: input.treatment,
    tooth,
    serviceId: input.serviceId ?? null,
    price: input.price,
    doctorPercent: payPercent,
    doctorShare: shareOf(input.price, payPercent, labCost),
    labOrderId: lab?.labOrderId ?? null,
    labCost,
    note: input.note ?? null,
  })
  await writeAudit(tx, {
    userId,
    action: AUDIT_ACTION.visit_created,
    entity: 'visit',
    entityId: id,
    meta: { patientId: input.patientId, doctorId },
  })
  const [row] = await withDoctorNames(tx, [visit])
  return row as VisitRow
}

export type VisitRow = Awaited<ReturnType<typeof repo.createVisit>> & { doctorName: string | null }

export function createVisit(
  deps: VisitDeps,
  clinicId: string,
  viewer: ScopedViewer,
  input: VisitCreateInput,
) {
  return withClinic(deps.db, clinicId, (tx) => createTx(tx, viewer, input))
}

/// Boshqa shifokorning tashrifi cheklangan koʻruvchi uchun yoʻq
function assertOwnVisit(viewer: ScopedViewer, visit: { doctorId: string | null }): void {
  if (!viewer.all && visit.doctorId !== viewer.userId) throw errors.notFound(VISIT_TEXT.not_found)
}

export function updateVisit(
  deps: VisitDeps,
  clinicId: string,
  viewer: ScopedViewer,
  id: string,
  input: VisitUpdateInput,
) {
  const { userId } = viewer
  return withClinic(deps.db, clinicId, async (tx) => {
    const current = await repo.findVisit(tx, id)
    if (!current) throw errors.notFound(VISIT_TEXT.not_found)
    assertOwnVisit(viewer, current)
    // Cheklangan koʻruvchi shifokorni oʻzgartira olmaydi — tashrif oʻzida qoladi
    if (!viewer.all) input = { ...input, doctorId: undefined }

    // Ulush qachon qayta sanaladi: shifokor almashsa — yangi shifokorning
    // joriy foizi; faqat narx oʻzgarsa — saqlangan foiz (snapshot buzilmaydi)
    const doctorChanged = input.doctorId !== undefined && input.doctorId !== current.doctorId
    let percent = current.doctorPercent
    if (doctorChanged && input.doctorId) {
      await assertDoctor(tx, input.doctorId)
      percent = (await auth.payTermsTx(tx, input.doctorId)).payPercent
    }
    const price = input.price ?? current.price
    // Narx olinganidan kam boʻlmasin — bogʻlangan toʻlov «havoda» qolmasin
    if (input.price !== undefined && input.price < current.price && deps.paidOfVisit) {
      const paid = await deps.paidOfVisit(tx, id)
      if (input.price < paid)
        throw errors.validation({ price: VISIT_TEXT.price_below_paid(formatSom(paid)) })
    }
    // Naryadga bogʻlangan tashrifda texnik narxi naryadniki — bu yerdan
    // oʻzgarmaydi (ikki joyda turgan son ajralib ketmasin)
    const labCostChanged =
      input.labCost !== undefined &&
      current.labOrderId === null &&
      input.labCost !== current.labCost
    const labCost = labCostChanged ? (input.labCost as number) : current.labCost
    const share =
      doctorChanged || input.price !== undefined || labCostChanged
        ? shareOf(price, percent, labCost)
        : current.doctorShare

    // Tahrirda ham soha tekshiriladi (19-boʻlim): eski, tishsiz yozuv
    // ochilganda foydalanuvchidan toʻldirish soʻraladi. Xizmat tashrif
    // yozilganda qotadi — tahrirda oʻzgarmaydi
    const areas = await services.areasOfTx(tx, current.serviceId ? [current.serviceId] : [])
    const tooth = services.toothForArea(
      current.serviceId ? areas.get(current.serviceId) : undefined,
      input.tooth === undefined ? current.tooth : input.tooth,
    )

    try {
      const visit = await repo.updateVisit(tx, id, {
        ...(doctorChanged ? { doctorId: input.doctorId, doctorPercent: percent } : {}),
        ...(input.date === undefined ? {} : { date: toDate(input.date) }),
        ...(input.time === undefined ? {} : { time: input.time }),
        ...(input.treatment === undefined ? {} : { treatment: input.treatment }),
        tooth,
        ...(input.price === undefined ? {} : { price: input.price }),
        ...(labCostChanged ? { labCost } : {}),
        doctorShare: share,
        ...(input.note === undefined ? {} : { note: input.note }),
      })
      await writeAudit(tx, {
        userId,
        action: AUDIT_ACTION.visit_updated,
        entity: 'visit',
        entityId: id,
      })
      const [row] = await withDoctorNames(tx, [visit])
      return row
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(VISIT_TEXT.not_found)
      throw error
    }
  })
}

export function removeVisit(deps: VisitDeps, clinicId: string, viewer: ScopedViewer, id: string) {
  const { userId } = viewer
  return withClinic(deps.db, clinicId, async (tx) => {
    if (!viewer.all) {
      const current = await repo.findVisit(tx, id)
      if (!current) throw errors.notFound(VISIT_TEXT.not_found)
      assertOwnVisit(viewer, current)
    }
    try {
      await repo.removeVisit(tx, id)
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(VISIT_TEXT.not_found)
      throw error
    }
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.visit_deleted,
      entity: 'visit',
      entityId: id,
    })
  })
}

/// Tish xaritasi umumiy: bemorni koʻra olgan har kim toʻliq xaritani
/// koʻradi — ikkinchi shifokor 16-tishda plomba borligini bilishi kerak
export function chart(deps: VisitDeps, clinicId: string, viewer: ScopedViewer, patientId: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, viewer, patientId)
    return repo.chart(tx, patientId)
  })
}

/// Butun xaritani qaytaradi: mijoz bitta tishni emas, tayyor holatni oladi
/// Boshqa modullar uchun (lab): naryad topshirilganda tish holatini yozadi.
/// Ochiq tranzaksiya ichida — chaqiruvchi sessiyani oʻzi ochgan
export async function setToothTx(
  tx: ClinicTx,
  patientId: string,
  tooth: number,
  data: { status: string; material?: string | null },
): Promise<void> {
  await repo.setTooth(tx, uuidV7(), patientId, tooth, {
    status: data.status,
    material: data.material ?? '',
  })
}

export function setTooth(
  deps: VisitDeps,
  clinicId: string,
  viewer: ScopedViewer,
  patientId: string,
  tooth: number,
  input: ToothUpdateInput,
) {
  const { userId } = viewer
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, viewer, patientId)

    const material = input.material ?? ''
    const note = input.note ?? null
    // «Sogʻlom», izohsiz va materialsiz — sukut holati, qator saqlanmaydi
    if (input.status === 'soglom' && !note && !material) {
      await repo.clearTooth(tx, patientId, tooth)
    } else {
      await repo.setTooth(tx, uuidV7(), patientId, tooth, { status: input.status, material, note })
    }

    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.tooth_updated,
      entity: 'tooth',
      entityId: `${patientId}:${tooth}`,
      meta: { status: input.status },
    })
    return repo.chart(tx, patientId)
  })
}

/// Koʻprikdagi tishning sukut roli: tishi yoʻq joyga quyma tish,
/// qolganiga tayanch koronka
function defaultRole(status: string | undefined): 'koronka' | 'koprik' {
  return status === 'olingan' || status === 'koprik' ? 'koprik' : 'koronka'
}

export function createBridge(
  deps: VisitDeps,
  clinicId: string,
  viewer: ScopedViewer,
  patientId: string,
  input: BridgeCreateInput,
) {
  const { userId } = viewer
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, viewer, patientId)

    // Ikkala tish bitta jagʻda boʻlishi shart — boʻlmasa oraliq boʻsh qaytadi
    const span = bridgeSpan(input.from, input.to)
    if (span.length < 2) throw errors.badRequest(VISIT_TEXT.bridge_same_arch)

    const { teeth } = await repo.chart(tx, patientId)
    const statusOf = new Map(teeth.map((t) => [t.tooth, t.status]))

    await repo.createBridge(tx, id, patientId, span, input.material)

    // Koʻprikdagi har tish oʻz roliga mos holatga oʻtadi va koʻprik
    // materialini oladi — xarita shuni chizadi
    for (const tooth of span) {
      const role = input.roles[String(tooth)] ?? defaultRole(statusOf.get(tooth))
      await repo.setTooth(tx, uuidV7(), patientId, tooth, {
        status: role,
        material: input.material,
        note: null,
      })
    }

    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.bridge_created,
      entity: 'bridge',
      entityId: id,
      meta: { patientId, teeth: span },
    })
    return repo.chart(tx, patientId)
  })
}

/// Oʻchirilganda tishlar holati qaytariladi: quyma tish oʻrnida tish yoʻq
/// edi — «olib tashlangan» boʻladi; tayanch tish esa «sogʻlom» ga qaytadi
export function removeBridge(deps: VisitDeps, clinicId: string, viewer: ScopedViewer, id: string) {
  const { userId } = viewer
  return withClinic(deps.db, clinicId, async (tx) => {
    const bridge = await repo.findBridge(tx, id)
    if (!bridge) throw errors.notFound(VISIT_TEXT.bridge_not_found)
    await assertPatient(tx, viewer, bridge.patientId)

    const { teeth } = await repo.chart(tx, bridge.patientId)
    const statusOf = new Map(teeth.map((t) => [t.tooth, t.status]))

    for (const tooth of bridge.teeth) {
      const status = statusOf.get(tooth)
      if (status === 'koprik') {
        await repo.setTooth(tx, uuidV7(), bridge.patientId, tooth, {
          status: 'olingan',
          material: '',
          note: null,
        })
      } else if (status === 'koronka') {
        // «Sogʻlom» sukut holat — qator saqlanmaydi
        await repo.clearTooth(tx, bridge.patientId, tooth)
      }
    }

    await repo.removeBridge(tx, id)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.bridge_deleted,
      entity: 'bridge',
      entityId: id,
      meta: { patientId: bridge.patientId },
    })
    return repo.chart(tx, bridge.patientId)
  })
}

/// Toʻliq eksport uchun (export moduli). Ochiq tranzaksiya ichida
export function exportVisitsTx(tx: ClinicTx) {
  return repo.allVisits(tx)
}

export function exportTeethTx(tx: ClinicTx) {
  return repo.allTeeth(tx)
}

export function exportBridgesTx(tx: ClinicTx) {
  return repo.allBridges(tx)
}
