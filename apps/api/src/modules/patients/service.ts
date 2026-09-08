// Kartoteka mantigʻi. Boshqa modullar patients ga faqat shu fayl orqali
// murojaat qiladi.

import {
  IMAGE_TEXT,
  IMPORT_TEXT,
  normalizePhone,
  PATIENT_EXCEL_COLUMNS,
  PATIENT_TEXT,
} from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import type { ImportStore } from '../../platform/importStore.js'
import { imageKey, type Storage } from '../../platform/storage.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import { buildErrorReport, buildExport, buildTemplate } from './excel.js'
import {
  type CellValue,
  detectColumns,
  type ParsedRow,
  parseCsv,
  parseRow,
} from './import-parse.js'
import * as repo from './repo.js'
import type { PatientCreateInput, PatientListInput, PatientUpdateInput } from './schema.js'

export interface PatientDeps {
  db: Db
  storage: Storage
  imports: ImportStore
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

// --- Excel ---

export function exportTemplate(): Promise<Buffer> {
  return buildTemplate()
}

/// Roʻyxatni Excel ga chiqarish. Audit'ga bitta yozuv: kim, qachon, nechta
export function exportPatients(deps: PatientDeps, clinicId: string, userId: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const rows = await repo.listAll(tx)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.patients_exported,
      entity: 'patient',
      meta: { count: rows.length },
    })
    return buildExport(rows)
  })
}

// --- Excel dan yuklash ---

const MAX_IMPORT_BYTES = 5 * 1024 * 1024
const MAX_IMPORT_ROWS = 5000
const PREVIEW_ROWS = 20

export type DuplicateMode = 'skip' | 'update' | 'add'

export interface ImportRow extends ParsedRow {
  /// Telefon yoki ID boʻyicha topilgan mavjud bemor
  duplicateOf: string | null
}

interface ImportSession {
  rows: ImportRow[]
}

export interface ImportPreview {
  token: string
  totalRows: number
  validCount: number
  errorCount: number
  duplicateCount: number
  /// Faqat birinchi 20 tasi — jadval ekranga sigʻsin
  rows: ImportRow[]
}

/// Faylni oʻqish: .xlsx uchun read-excel-file, .csv uchun oʻz tahlilchimiz
async function readTable(buffer: Buffer, filename: string): Promise<CellValue[][]> {
  if (/\.csv$/i.test(filename)) {
    return parseCsv(buffer.toString('utf8'))
  }

  const { Readable } = await import('node:stream')
  const readXlsxFile = (await import('read-excel-file/node')).default
  // Oqimdan oʻqilganda kutubxona barcha varaqlarni qaytaradi —
  // bizga birinchisi kerak
  const sheets = (await readXlsxFile(Readable.from(buffer))) as unknown as {
    data: CellValue[][]
  }[]
  return sheets[0]?.data ?? []
}

export async function importPreview(
  deps: PatientDeps,
  clinicId: string,
  file: { buffer: Buffer; filename: string },
  hasHeader: boolean,
): Promise<ImportPreview> {
  if (file.buffer.length === 0) throw errors.badRequest(IMPORT_TEXT.no_file)
  if (file.buffer.length > MAX_IMPORT_BYTES) throw errors.badRequest(IMPORT_TEXT.too_large)
  if (!/\.(xlsx|csv)$/i.test(file.filename)) throw errors.badRequest(IMPORT_TEXT.wrong_type)

  const table = await readTable(file.buffer, file.filename)
  if (table.length === 0) throw errors.badRequest(IMPORT_TEXT.empty)
  if (table.length > MAX_IMPORT_ROWS + 1) {
    throw errors.badRequest(IMPORT_TEXT.too_many_rows(MAX_IMPORT_ROWS))
  }

  // Birinchi qator sarlavhami — foydalanuvchi belgilaydi, taxmin qilinmaydi
  const header = hasHeader ? (table[0] ?? []) : defaultHeader()
  const { columns, missing } = detectColumns(header)
  if (missing) throw errors.badRequest(IMPORT_TEXT.column_missing(missing))

  const body = hasHeader ? table.slice(1) : table
  const parsed = body.map((row, index) => parseRow(row, columns, index + (hasHeader ? 2 : 1)))

  const rows = await withClinic(deps.db, clinicId, async (tx) => {
    const phones = await repo.phoneIndex(tx)
    const ids = await repo.existingIds(
      tx,
      parsed.map((row) => row.values.id).filter((id): id is string => Boolean(id)),
    )

    return parsed.map((row): ImportRow => {
      const errorsForRow = { ...row.errors }
      let duplicateOf: string | null = null

      if (row.values.id) {
        // ID faqat chiqarilgan faylda boʻladi — notoʻgʻrisi xato
        if (ids.has(row.values.id)) duplicateOf = row.values.id
        else errorsForRow.id = IMPORT_TEXT.id_unknown
      } else if (row.values.phone) {
        duplicateOf = phones.get(row.values.phone) ?? null
      }

      return { ...row, errors: errorsForRow, duplicateOf }
    })
  })

  const token = await deps.imports.save(clinicId, { rows } satisfies ImportSession)

  return {
    token,
    totalRows: rows.length,
    validCount: rows.filter((row) => Object.keys(row.errors).length === 0).length,
    errorCount: rows.filter((row) => Object.keys(row.errors).length > 0).length,
    duplicateCount: rows.filter((row) => row.duplicateOf !== null).length,
    rows: rows.slice(0, PREVIEW_ROWS),
  }
}

/// Sarlavhasiz faylda ustunlar shablon tartibida deb qabul qilinadi
function defaultHeader(): string[] {
  return [
    PATIENT_EXCEL_COLUMNS.id,
    PATIENT_EXCEL_COLUMNS.fio,
    PATIENT_EXCEL_COLUMNS.phone,
    PATIENT_EXCEL_COLUMNS.birthDate,
    PATIENT_EXCEL_COLUMNS.address,
    PATIENT_EXCEL_COLUMNS.note,
  ]
}

export interface ImportResult {
  added: number
  updated: number
  skipped: number
  errorCount: number
  /// Xatoli qatorlar boʻlsa — ularni Excel faylga chiqarish uchun token
  errorsToken: string | null
}

export async function importCommit(
  deps: PatientDeps,
  clinicId: string,
  userId: string,
  token: string,
  mode: DuplicateMode,
): Promise<ImportResult> {
  const session = await deps.imports.read<ImportSession>(clinicId, token)
  if (!session) throw errors.badRequest(IMPORT_TEXT.session_expired)

  const failed = session.rows.filter((row) => Object.keys(row.errors).length > 0)
  const usable = session.rows.filter((row) => Object.keys(row.errors).length === 0)

  let added = 0
  let updated = 0
  let skipped = failed.length

  await withClinic(deps.db, clinicId, async (tx) => {
    for (const row of usable) {
      const data = {
        fio: row.values.fio,
        phone: row.values.phone,
        birthDate: row.values.birthDate ? toDate(row.values.birthDate) : null,
        address: row.values.address,
        note: row.values.note,
      }

      // ID berilgan qator har doim yangilanadi — u chiqarilgan fayldan
      // qaytgan, ya'ni mijoz aynan shu bemorni tuzatgan
      if (row.values.id) {
        await repo.update(tx, row.values.id, data)
        updated++
        continue
      }

      if (row.duplicateOf) {
        if (mode === 'skip') {
          skipped++
          continue
        }
        if (mode === 'update') {
          await repo.update(tx, row.duplicateOf, data)
          updated++
          continue
        }
      }

      await repo.create(tx, uuidV7(), data)
      added++
    }

    // Butun yuklash audit'ga bitta yozuv sifatida tushadi (tz.md 8-boʻlim)
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.patients_imported,
      entity: 'patient',
      meta: { added, updated, skipped, mode },
    })
  })

  const errorsToken = failed.length > 0 ? await deps.imports.save(clinicId, { rows: failed }) : null

  return { added, updated, skipped, errorCount: failed.length, errorsToken }
}

/// Xatoli qatorlar alohida Excel faylda — mijoz tuzatib qayta yuklaydi
export async function importErrors(
  deps: PatientDeps,
  clinicId: string,
  token: string,
): Promise<Buffer> {
  const session = await deps.imports.read<ImportSession>(clinicId, token)
  if (!session) throw errors.badRequest(IMPORT_TEXT.session_expired)
  return buildErrorReport(session.rows)
}
