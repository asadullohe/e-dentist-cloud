// Kartoteka mantigʻi. Boshqa modullar patients ga faqat shu fayl orqali
// murojaat qiladi.

import { IMAGE_TEXT, normalizePhone, PATIENT_TEXT } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { imageKey, type Storage } from '../../platform/storage.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as repo from './repo.js'
import type { PatientCreateInput, PatientListInput, PatientUpdateInput } from './schema.js'

export interface PatientDeps {
  db: Db
  storage: Storage
}

/// `YYYY-MM-DD` → DATE ustuni uchun UTC yarim tuni.
/// Mahalliy yarim tun yozilsa Toshkent UTC+5 boʻlgani uchun kun bir kun
/// orqaga suriladi (shared/format.ts dagi toDbDate bilan bir xil sabab)
function toDate(value: string | undefined): Date | null | undefined {
  if (value === undefined) return undefined
  return value ? new Date(`${value}T00:00:00Z`) : null
}

function fields(input: PatientCreateInput | PatientUpdateInput) {
  return {
    ...(input.fio === undefined ? {} : { fio: input.fio }),
    ...(input.phone === undefined ? {} : { phone: normalizePhone(input.phone) }),
    ...(input.birthDate === undefined ? {} : { birthDate: toDate(input.birthDate) }),
    ...(input.address === undefined ? {} : { address: input.address || null }),
    ...(input.note === undefined ? {} : { note: input.note || null }),
  }
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025'
  )
}

function hasRelatedRecords(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2003'
  )
}

/// Boshqa modullar uchun: bemor shu klinikaniki ekanini tekshirish.
///
/// Tashqi kalit tekshiruvi RLS ni chetlab oʻtadi — usiz begona klinikaning
/// bemoriga tashrif yoki toʻlov bogʻlab qoʻyish mumkin boʻlardi
export function existsInClinic(tx: ClinicTx, patientId: string): Promise<boolean> {
  return repo.exists(tx, patientId)
}

/// Boshqa modullar uchun: identifikatorlar boʻyicha bemor nomlari
export function findByIds(tx: ClinicTx, ids: string[]) {
  return repo.findByIds(tx, ids)
}

export function list(deps: PatientDeps, clinicId: string, input: PatientListInput) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const { items, total } = await repo.list(tx, input)
    return { items, total, page: input.page, pageSize: input.pageSize }
  })
}

/// Kartochka ochilishi audit'ga yoziladi — tibbiy maʼlumot uchun kim nima
/// koʻrgani ham yozilishi shart (tz.md 12-boʻlim)
export function get(deps: PatientDeps, clinicId: string, userId: string, id: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const patient = await repo.findById(tx, id)
    if (!patient) throw errors.notFound(PATIENT_TEXT.not_found)

    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.patient_viewed,
      entity: 'patient',
      entityId: id,
    })
    return patient
  })
}

export function create(
  deps: PatientDeps,
  clinicId: string,
  userId: string,
  input: PatientCreateInput,
) {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    const patient = await repo.create(tx, id, { ...fields(input), fio: input.fio })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.patient_created,
      entity: 'patient',
      entityId: id,
    })
    return patient
  })
}

export function update(
  deps: PatientDeps,
  clinicId: string,
  userId: string,
  id: string,
  input: PatientUpdateInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      const patient = await repo.update(tx, id, fields(input))
      await writeAudit(tx, {
        userId,
        action: AUDIT_ACTION.patient_updated,
        entity: 'patient',
        entityId: id,
      })
      return patient
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(PATIENT_TEXT.not_found)
      throw error
    }
  })
}

export function remove(deps: PatientDeps, clinicId: string, userId: string, id: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      await repo.remove(tx, id)
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(PATIENT_TEXT.not_found)
      // Tashrif yoki toʻlov bogʻlangan boʻlsa baza oʻchirishga yoʻl bermaydi —
      // tarix yoʻqolib ketmasin
      if (hasRelatedRecords(error)) throw errors.conflict(PATIENT_TEXT.has_records)
      throw error
    }
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.patient_deleted,
      entity: 'patient',
      entityId: id,
    })
  })
}

// --- Bemor rasmlari ---

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export interface UploadedFile {
  buffer: Buffer
  mimetype: string
  caption: string | null
}

export function listImages(deps: PatientDeps, clinicId: string, patientId: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const rows = await repo.listImages(tx, patientId)
    // Ochiq URL berilmaydi — har rasm uchun qisqa muddatli imzolangan havola
    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        caption: row.caption,
        url: await deps.storage.signedUrl(row.key),
      })),
    )
  })
}

export async function uploadImage(
  deps: PatientDeps,
  clinicId: string,
  userId: string,
  patientId: string,
  file: UploadedFile,
) {
  const ext = IMAGE_TYPES[file.mimetype]
  if (!ext) throw errors.badRequest(IMAGE_TEXT.wrong_type)
  if (file.buffer.length === 0) throw errors.badRequest(IMAGE_TEXT.no_file)
  if (file.buffer.length > MAX_IMAGE_BYTES) throw errors.badRequest(IMAGE_TEXT.too_large)

  const id = uuidV7()
  const key = imageKey(clinicId, patientId, id, ext)

  await withClinic(deps.db, clinicId, (tx) => assertPatientExists(tx, patientId))

  // Avval fayl, keyin yozuv: aks holda bazadagi qator yoʻq faylga
  // koʻrsatib turishi mumkin edi
  await deps.storage.put(key, file.buffer, file.mimetype)

  return withClinic(deps.db, clinicId, async (tx) => {
    const image = await repo.createImage(tx, id, patientId, key, file.caption)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.image_uploaded,
      entity: 'image',
      entityId: id,
      meta: { patientId },
    })
    return { id: image.id, caption: image.caption, url: await deps.storage.signedUrl(key) }
  })
}

export async function removeImage(deps: PatientDeps, clinicId: string, userId: string, id: string) {
  const key = await withClinic(deps.db, clinicId, async (tx) => {
    const image = await repo.findImage(tx, id)
    if (!image) throw errors.notFound(IMAGE_TEXT.not_found)

    await repo.removeImage(tx, id)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.image_deleted,
      entity: 'image',
      entityId: id,
    })
    return image.key
  })

  // Yozuv oʻchgach fayl ham. Bu yerda xato boʻlsa saqlagichda yetim fayl
  // qoladi — bu bazadagi qator yoʻq faylga koʻrsatishidan yaxshiroq
  await deps.storage.remove(key)
}

/// Bemor shu klinikaniki ekanini tekshiradi (yuqoridagi assertPatient bilan
/// bir xil, lekin bu modulning oʻzida — patients oʻz jadvalini biladi)
async function assertPatientExists(tx: ClinicTx, patientId: string): Promise<void> {
  if (!(await repo.exists(tx, patientId))) throw errors.notFound(PATIENT_TEXT.not_found)
}
