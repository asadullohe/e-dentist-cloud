// Davolash rejalari (tz.md 18-boʻlim). Reja → bosqichlar → bandlar.
//
// Bemorga yozma, bosqichli, narxi koʻrsatilgan taklif. Bandning nomi va
// narxi snapshot: narxnoma keyin oʻzgarsa tuzilgan reja oʻzgarmaydi.
//
// Bemor ismi va xodim ismlari boshqa modullarning jadvallarida — ular
// `patients` va `auth` ning xizmat qatlamidan olinadi, jadvalga tegilmaydi.

import { PATIENT_TEXT, PLAN_TEXT, todayISO } from '@e-dentist/shared'
import type { PlanItemStatus, PlanStatus } from '../../../generated/prisma/client.js'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import type { ScopedViewer } from '../../platform/guards.js'
import { generatePublicCode } from '../../platform/publicCode.js'
import type { RateLimiter } from '../../platform/rateLimit.js'
import type { Storage } from '../../platform/storage.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as auth from '../auth/service.js'
import * as patients from '../patients/service.js'
import * as repo from './repo.js'
import type {
  PlanContentInput,
  PlanCreateInput,
  PlanListInput,
  PlanRespondInput,
  PlanStatusInput,
  PlanUpdateInput,
} from './schema.js'

export interface PlanDeps {
  db: Db
  /// Ochiq sahifadagi javob uchun — kabinet marshrutlariga kerak emas
  rateLimiter: RateLimiter
  /// Klinika logotipi ochiq sahifada koʻrsatiladi
  storage: Storage
}

export interface PlanItemView {
  id: string
  tooth: number | null
  serviceId: string | null
  treatment: string
  price: number
  qty: number
  /// price × qty
  total: number
  status: PlanItemStatus
  visitId: string | null
  note: string | null
}

export interface PlanStageView {
  id: string
  name: string
  note: string | null
  total: number
  items: PlanItemView[]
}

export interface PlanView {
  id: string
  patientId: string
  fio: string
  doctorId: string
  doctorName: string
  title: string
  status: PlanStatus
  /// Bandlarning jami summasi
  total: number
  discount: number
  /// total − discount: bemor toʻlaydigan summa
  payable: number
  itemCount: number
  doneCount: number
  /// YYYY-MM-DD yoki boʻsh
  validUntil: string | null
  /// Narx muddati oʻtganmi — hali qabul qilinmagan rejada muhim
  expired: boolean
  publicCode: string
  note: string | null
  declineReason: string | null
  cancelReason: string | null
  acceptedAt: string | null
  createdAt: string
  stages: PlanStageView[]
}

/// Qoʻlda oʻtkaziladigan holatlar. `done` bu yerda yoʻq — u oxirgi band
/// bajarilganda oʻzi qoʻyiladi (13.4)
const ALLOWED_FLOW: Record<PlanStatus, readonly PlanStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['accepted', 'declined', 'cancelled'],
  // Bemor fikrini oʻzgartirishi mumkin — rad etilgan reja qayta yuboriladi
  declined: ['sent', 'cancelled'],
  accepted: ['cancelled'],
  // Bajarilgan va bekor qilingan reja qotadi
  done: [],
  cancelled: [],
}

/// Bekor qilish va rad etish sababsiz boʻlmaydi: yozuv qoladi, lekin nega
/// ekani yoʻqolsa uning qiymati ham yoʻqoladi
const REASON_REQUIRED: readonly PlanStatus[] = ['declined', 'cancelled']

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function itemTotal(item: repo.ItemRow): number {
  return item.price * item.qty
}

function planTotal(stages: repo.StageRow[]): number {
  return stages.reduce(
    (sum, stage) => sum + stage.items.reduce((inner, item) => inner + itemTotal(item), 0),
    0,
  )
}

async function toView(tx: ClinicTx, rows: repo.PlanFullRow[]): Promise<PlanView[]> {
  const today = todayISO()

  const people = await patients.findByIds(tx, [...new Set(rows.map((row) => row.patientId))])
  const fio = new Map(people.map((person) => [person.id, person.fio]))
  const names = await auth.staffNamesTx(tx, [...new Set(rows.map((row) => row.doctorId))])

  return rows.map((row) => {
    const total = planTotal(row.stages)
    const items = row.stages.flatMap((stage) => stage.items)
    const validUntil = row.validUntil ? toIso(row.validUntil) : null

    return {
      id: row.id,
      patientId: row.patientId,
      fio: fio.get(row.patientId) ?? '',
      doctorId: row.doctorId,
      doctorName: names.get(row.doctorId) ?? '',
      title: row.title,
      status: row.status,
      total,
      discount: row.discount,
      payable: Math.max(0, total - row.discount),
      itemCount: items.length,
      doneCount: items.filter((item) => item.status === 'done').length,
      validUntil,
      // Qabul qilingan rejada muddat ahamiyatsiz — narx allaqachon kelishilgan
      expired:
        validUntil !== null &&
        validUntil < today &&
        (row.status === 'draft' || row.status === 'sent'),
      publicCode: row.publicCode,
      note: row.note,
      declineReason: row.declineReason,
      cancelReason: row.cancelReason,
      acceptedAt: row.acceptedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      stages: row.stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        note: stage.note,
        total: stage.items.reduce((sum, item) => sum + itemTotal(item), 0),
        items: stage.items.map((item) => ({
          id: item.id,
          tooth: item.tooth,
          serviceId: item.serviceId,
          treatment: item.treatment,
          price: item.price,
          qty: item.qty,
          total: itemTotal(item),
          status: item.status,
          visitId: item.visitId,
          note: item.note,
        })),
      })),
    }
  })
}

/// Reja shu klinikaniki va bemori koʻruvchiga koʻrinadi: shifokor
/// (patients.all yoʻq) boshqaning bemorining rejasini koʻrmaydi (11.3)
async function load(tx: ClinicTx, viewer: ScopedViewer, id: string): Promise<repo.PlanFullRow> {
  const row = await repo.findById(tx, id)
  if (!row) throw errors.notFound(PLAN_TEXT.not_found)
  if (!(await patients.isVisibleTx(tx, viewer, row.patientId))) {
    throw errors.notFound(PLAN_TEXT.not_found)
  }
  return row
}

/// Bajarilgan va bekor qilingan reja oʻzgartirilmaydi — tarix qotadi
function assertEditable(row: repo.PlanFullRow): void {
  if (row.status === 'done' || row.status === 'cancelled') {
    throw errors.badRequest(PLAN_TEXT.locked)
  }
}

function assertDiscount(total: number, discount: number): void {
  if (discount > total) throw errors.badRequest(PLAN_TEXT.discount_too_big)
}

export function list(
  deps: PlanDeps,
  clinicId: string,
  viewer: ScopedViewer,
  input: PlanListInput,
): Promise<PlanView[]> {
  return withClinic(deps.db, clinicId, async (tx) => {
    if (input.patientId && !(await patients.isVisibleTx(tx, viewer, input.patientId))) {
      throw errors.notFound(PATIENT_TEXT.not_found)
    }

    // Bemor tanlanmagan boʻlsa — shifokorga faqat oʻzi koʻradigan
    // bemorlarning rejalari
    const patientIds =
      input.patientId || viewer.all ? undefined : await patients.visibleIdsTx(tx, viewer)

    const rows = await repo.list(tx, {
      ...(input.patientId ? { patientId: input.patientId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(patientIds ? { patientIds } : {}),
    })
    return toView(tx, rows)
  })
}

export function get(
  deps: PlanDeps,
  clinicId: string,
  viewer: ScopedViewer,
  id: string,
): Promise<PlanView> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const row = await load(tx, viewer, id)
    const [view] = await toView(tx, [row])
    return view as PlanView
  })
}

export function create(
  deps: PlanDeps,
  clinicId: string,
  viewer: ScopedViewer,
  input: PlanCreateInput,
): Promise<PlanView> {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    if (!(await patients.isVisibleTx(tx, viewer, input.patientId))) {
      throw errors.notFound(PATIENT_TEXT.not_found)
    }

    // Cheklangan koʻruvchi (shifokor) faqat oʻz nomidan tuzadi — aks holda
    // oʻzi koʻrolmaydigan reja chiqardi. Tashrifdagi qoida bilan bir xil
    const doctorId = viewer.all ? (input.doctorId ?? viewer.userId) : viewer.userId
    if (!(await auth.existsInClinic(tx, doctorId))) {
      throw errors.notFound(PLAN_TEXT.doctor_not_found)
    }

    const created = await repo.create(tx, id, {
      patientId: input.patientId,
      doctorId,
      title: input.title ?? PLAN_TEXT.default_title,
      discount: input.discount,
      validUntil: input.validUntil ? toDate(input.validUntil) : null,
      publicCode: generatePublicCode(),
      note: input.note ?? null,
      createdBy: viewer.userId,
    })
    await writeAudit(tx, {
      userId: viewer.userId,
      action: AUDIT_ACTION.plan_created,
      entity: 'treatment_plan',
      entityId: id,
      meta: { patientId: input.patientId, doctorId },
    })

    const [view] = await toView(tx, [{ ...created, stages: [] }])
    return view as PlanView
  })
}

export function update(
  deps: PlanDeps,
  clinicId: string,
  viewer: ScopedViewer,
  id: string,
  input: PlanUpdateInput,
): Promise<PlanView> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const row = await load(tx, viewer, id)
    assertEditable(row)

    if (input.discount !== undefined) assertDiscount(planTotal(row.stages), input.discount)

    // Shifokorni faqat hamma bemorni koʻradigan (egasi) almashtira oladi
    if (input.doctorId !== undefined) {
      if (!viewer.all) throw errors.forbidden()
      if (!(await auth.existsInClinic(tx, input.doctorId))) {
        throw errors.notFound(PLAN_TEXT.doctor_not_found)
      }
    }

    await repo.update(tx, id, {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.doctorId === undefined ? {} : { doctorId: input.doctorId }),
      ...(input.discount === undefined ? {} : { discount: input.discount }),
      ...(input.validUntil === undefined
        ? {}
        : { validUntil: input.validUntil ? toDate(input.validUntil) : null }),
      ...(input.note === undefined ? {} : { note: input.note }),
    })
    await writeAudit(tx, {
      userId: viewer.userId,
      action: AUDIT_ACTION.plan_updated,
      entity: 'treatment_plan',
      entityId: id,
    })

    const [view] = await toView(tx, [await load(tx, viewer, id)])
    return view as PlanView
  })
}

/// Bosqichlar va bandlar toʻliq almashtiriladi: kelgan tartib saqlanadi,
/// kelmagan yozuvlar oʻchiriladi. Bajarilgan band (tashrifi bor) oʻchmaydi —
/// u ish haqi hisobiga kirib boʻlgan
export function saveContent(
  deps: PlanDeps,
  clinicId: string,
  viewer: ScopedViewer,
  id: string,
  input: PlanContentInput,
): Promise<PlanView> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const row = await load(tx, viewer, id)
    assertEditable(row)

    const oldStages = new Map(row.stages.map((stage) => [stage.id, stage]))
    const oldItems = new Map(row.stages.flatMap((s) => s.items).map((item) => [item.id, item]))

    const keptStages = new Set<string>()
    const keptItems = new Set<string>()
    let total = 0

    for (const [stageIndex, stage] of input.stages.entries()) {
      let stageId = stage.id
      if (stageId !== undefined) {
        if (!oldStages.has(stageId)) throw errors.notFound(PLAN_TEXT.stage_not_found)
        await repo.updateStage(tx, stageId, {
          name: stage.name,
          position: stageIndex,
          note: stage.note ?? null,
        })
      } else {
        stageId = uuidV7()
        await repo.createStage(tx, stageId, {
          planId: id,
          name: stage.name,
          position: stageIndex,
          note: stage.note ?? null,
        })
      }
      keptStages.add(stageId)

      for (const [itemIndex, item] of stage.items.entries()) {
        const fields = {
          stageId,
          position: itemIndex,
          tooth: item.tooth ?? null,
          serviceId: item.serviceId ?? null,
          treatment: item.treatment,
          price: item.price,
          qty: item.qty,
          note: item.note ?? null,
        }
        total += item.price * item.qty

        if (item.id !== undefined) {
          if (!oldItems.has(item.id)) throw errors.notFound(PLAN_TEXT.item_not_found)
          await repo.updateItem(tx, item.id, fields)
          keptItems.add(item.id)
        } else {
          const itemId = uuidV7()
          await repo.createItem(tx, itemId, fields)
          keptItems.add(itemId)
        }
      }
    }

    assertDiscount(total, row.discount)

    const removedItems = [...oldItems.keys()].filter((itemId) => !keptItems.has(itemId))
    if (removedItems.some((itemId) => oldItems.get(itemId)?.visitId)) {
      throw errors.badRequest(PLAN_TEXT.item_done_remove)
    }
    if (removedItems.length > 0) await repo.removeItems(tx, removedItems)

    // Bosqich oʻchirilsa ichidagi bandlar ham ketadi (CASCADE) — shuning
    // uchun oldin bajarilgani yoʻqligi tekshiriladi
    const removedStages = [...oldStages.keys()].filter((stageId) => !keptStages.has(stageId))
    if (
      removedStages.some((stageId) => oldStages.get(stageId)?.items.some((item) => item.visitId))
    ) {
      throw errors.badRequest(PLAN_TEXT.item_done_remove)
    }
    if (removedStages.length > 0) await repo.removeStages(tx, removedStages)

    await writeAudit(tx, {
      userId: viewer.userId,
      action: AUDIT_ACTION.plan_updated,
      entity: 'treatment_plan',
      entityId: id,
      meta: { stages: input.stages.length },
    })

    const [view] = await toView(tx, [await load(tx, viewer, id)])
    return view as PlanView
  })
}

export function setStatus(
  deps: PlanDeps,
  clinicId: string,
  viewer: ScopedViewer,
  id: string,
  input: PlanStatusInput,
): Promise<PlanView> {
  const reason = input.reason?.trim() || null
  if (REASON_REQUIRED.includes(input.status) && !reason) {
    throw errors.validation({ reason: PLAN_TEXT.reason_required })
  }

  return withClinic(deps.db, clinicId, async (tx) => {
    const row = await load(tx, viewer, id)
    if (!ALLOWED_FLOW[row.status].includes(input.status)) {
      throw errors.badRequest(PLAN_TEXT.status_flow)
    }

    const now = new Date()
    await repo.update(tx, id, {
      status: input.status,
      ...(input.status === 'accepted'
        ? { acceptedAt: now, declinedAt: null, declineReason: null }
        : {}),
      ...(input.status === 'declined' ? { declinedAt: now, declineReason: reason } : {}),
      ...(input.status === 'cancelled' ? { cancelledAt: now, cancelReason: reason } : {}),
      // Qayta yuborilganda eski rad javobi toza boʻlsin
      ...(input.status === 'sent' ? { declinedAt: null, declineReason: null } : {}),
    })
    await writeAudit(tx, {
      userId: viewer.userId,
      action: AUDIT_ACTION.plan_status_changed,
      entity: 'treatment_plan',
      entityId: id,
      meta: { status: input.status },
    })

    const [view] = await toView(tx, [await load(tx, viewer, id)])
    return view as PlanView
  })
}

// ──────────────────────  Ochiq sahifa: /r/<kod>  ──────────────────────
//
// Sessiya yoʻq: kod rejani ham, klinikani ham topadi. Bemor rejani koʻradi
// va roziligini bildiradi — shundan keyin klinika ishni boshlaydi.

// Suiisteʼmoldan himoya — fikrlar sahifasidagi kabi
const IP_LIMIT = 30
const IP_WINDOW = 60 * 60
const DEVICE_LIMIT = 10
const DEVICE_WINDOW = 24 * 60 * 60

/// Bemor ochiq sahifada koʻradigan narsa. Bemorning toʻliq ismi, telefoni
/// va boshqa tashriflari bu yerga chiqmaydi — havola begonaga tushsa ham
/// kartoteka ochilmasin
export interface PlanPublicView {
  clinicName: string
  hasLogo: boolean
  publicPhone: string | null
  address: string | null
  /// «Karimova M. R.» — bemor «bu meniki» deb tanishi uchun yetadi
  patientName: string
  doctorName: string
  title: string
  status: PlanStatus
  validUntil: string | null
  expired: boolean
  total: number
  discount: number
  payable: number
  /// Tish xaritasida belgilanadigan tishlar
  teeth: number[]
  stages: {
    name: string
    note: string | null
    total: number
    items: {
      tooth: number | null
      treatment: string
      price: number
      qty: number
      total: number
      done: boolean
    }[]
  }[]
  /// Javob berish mumkinmi: yuborilgan va muddati oʻtmagan
  canRespond: boolean
  /// Bemorda telefon bor — javobda oxirgi 4 raqam soʻraladi
  needsPhone: boolean
}

/// «Karimova Madina Rustamovna» → «Karimova M. R.»
function shortName(fio: string): string {
  const [surname, ...rest] = fio.trim().split(/\s+/)
  if (!surname) return ''
  const initials = rest.map((word) => `${word[0]?.toUpperCase() ?? ''}.`).join(' ')
  return initials ? `${surname} ${initials}` : surname
}

/// Qoralama va bekor qilingan reja ochiq sahifada yoʻq: birinchisi hali
/// bemorga koʻrsatilmagan, ikkinchisi endi amal qilmaydi
function publicVisible(status: PlanStatus): boolean {
  return status !== 'draft' && status !== 'cancelled'
}

async function loadPublic(deps: PlanDeps, code: string) {
  const found = await repo.findByPublicCode(deps.db, code)
  if (!found) throw errors.notFound(PLAN_TEXT.not_available)
  return found
}

export async function publicPage(deps: PlanDeps, code: string): Promise<PlanPublicView> {
  const found = await loadPublic(deps, code)

  return withClinic(deps.db, found.clinic_id, async (tx) => {
    const row = await repo.findById(tx, found.plan_id)
    if (!row || !publicVisible(row.status)) throw errors.notFound(PLAN_TEXT.not_available)

    const [person] = await patients.findByIds(tx, [row.patientId])
    const names = await auth.staffNamesTx(tx, [row.doctorId])

    const total = planTotal(row.stages)
    const validUntil = row.validUntil ? toIso(row.validUntil) : null
    const expired = validUntil !== null && validUntil < todayISO() && row.status === 'sent'

    return {
      clinicName: found.name,
      hasLogo: found.logo_key !== null,
      publicPhone: found.public_phone,
      address: found.address,
      patientName: shortName(person?.fio ?? ''),
      doctorName: names.get(row.doctorId) ?? '',
      title: row.title,
      status: row.status,
      validUntil,
      expired,
      total,
      discount: row.discount,
      payable: Math.max(0, total - row.discount),
      teeth: [
        ...new Set(
          row.stages.flatMap((stage) =>
            stage.items.flatMap((item) => (item.tooth === null ? [] : [item.tooth])),
          ),
        ),
      ],
      stages: row.stages.map((stage) => ({
        name: stage.name,
        note: stage.note,
        total: stage.items.reduce((sum, item) => sum + itemTotal(item), 0),
        items: stage.items.map((item) => ({
          tooth: item.tooth,
          treatment: item.treatment,
          price: item.price,
          qty: item.qty,
          total: itemTotal(item),
          done: item.status === 'done',
        })),
      })),
      canRespond: row.status === 'sent' && !expired,
      needsPhone: Boolean(person?.phone),
    }
  })
}

/// Klinika logotipi ochiq sahifada. Navbatdagi `/n/<kod>/logo` bilan bir xil
/// sabab: fayl serverdagi omborda turibdi, brauzer uning manzilini topa
/// olmaydi — rasm API orqali beriladi
export async function publicLogo(
  deps: PlanDeps,
  code: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  const found = await repo.findByPublicCode(deps.db, code)
  if (!found?.logo_key) return null
  return deps.storage.get(found.logo_key)
}

/// Bemorning javobi. Qaytadigan narsa ataylab tor — sahifa shundan keyin
/// «rahmat» ekranini koʻrsatadi
export async function respond(
  deps: PlanDeps,
  code: string,
  input: PlanRespondInput,
  who: { ip: string; deviceId: string },
): Promise<{ status: PlanStatus }> {
  const found = await loadPublic(deps, code)

  const byIp = await deps.rateLimiter.hit(`plan:ip:${who.ip}`, IP_LIMIT, IP_WINDOW)
  if (!byIp.allowed) throw errors.rateLimited(PLAN_TEXT.too_many)
  const byDevice = await deps.rateLimiter.hit(
    `plan:device:${who.deviceId}`,
    DEVICE_LIMIT,
    DEVICE_WINDOW,
  )
  if (!byDevice.allowed) throw errors.rateLimited(PLAN_TEXT.too_many)

  return withClinic(deps.db, found.clinic_id, async (tx) => {
    const row = await repo.findById(tx, found.plan_id)
    if (!row || !publicVisible(row.status)) throw errors.notFound(PLAN_TEXT.not_available)
    if (row.status !== 'sent') throw errors.conflict(PLAN_TEXT.already_answered)

    const validUntil = row.validUntil ? toIso(row.validUntil) : null
    if (validUntil !== null && validUntil < todayISO()) {
      throw errors.badRequest(PLAN_TEXT.expired_public)
    }

    // Kod tasodifan boshqa odamga tushsa — u rejani koʻrsa ham javob bera
    // olmaydi. Bemorda telefon boʻlmasa tekshiradigan narsa yoʻq
    const [person] = await patients.findByIds(tx, [row.patientId])
    if (person?.phone) {
      if (!input.phoneTail) throw errors.validation({ phoneTail: PLAN_TEXT.phone_required })
      if (!person.phone.endsWith(input.phoneTail)) {
        throw errors.validation({ phoneTail: PLAN_TEXT.phone_wrong })
      }
    }

    const reason = input.reason?.trim() || null
    const now = new Date()
    const status: PlanStatus = input.accept ? 'accepted' : 'declined'

    await repo.update(tx, row.id, {
      status,
      ...(input.accept
        ? { acceptedAt: now, declinedAt: null, declineReason: null }
        : { declinedAt: now, declineReason: reason }),
    })
    await writeAudit(tx, {
      userId: null,
      action: AUDIT_ACTION.plan_status_changed,
      entity: 'treatment_plan',
      entityId: row.id,
      // Kabinetdan emas, bemorning oʻzidan kelgani koʻrinib tursin
      meta: { status, via: 'public' },
    })

    return { status }
  })
}
