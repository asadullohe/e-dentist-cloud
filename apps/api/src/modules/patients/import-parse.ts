// Excel/CSV faylni oʻqish va qatorlarni tekshirish.
//
// Bu yerdagi hamma narsa sof funksiya: bazaga ham, tarmoqqa ham tegmaydi.
// Shuning uchun tuzoqlarni test bilan qulflab qoʻyish oson.

import { IMPORT_TEXT, normalizePhone, PATIENT_EXCEL_COLUMNS, phoneDigits } from '@e-dentist/shared'

export type CellValue = string | number | Date | boolean | null

/// Ustun nomlari sarlavha boʻyicha tanaladi — tartibi oʻzgarsa ham,
/// ortiqcha ustun qoʻshilsa ham ishlaydi (tz.md 8-boʻlim)
const ALIASES: Record<keyof typeof PATIENT_EXCEL_COLUMNS, string[]> = {
  id: ['id'],
  fio: ['fio', 'f.i.o.', 'f.i.o', 'ism', 'ismi', 'ism-familiya', 'ism familiya', 'familiya'],
  phone: ['telefon', 'tel', 'telefon raqami', 'raqam'],
  birthDate: ['tugilgan sana', 'tugulgan sana', 'sana', 'tugilgan kun', 'tug sana'],
  address: ['manzil', 'adres'],
  note: ['izoh', 'eslatma', 'qayd'],
}

/// Sarlavhani solishtirish uchun: kichik harf, apostrofsiz, ortiqcha
/// boʻshliqsiz. «Tugʻilgan sana» va «tugilgan sana» bir xil boʻlsin
function headerKey(value: CellValue): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[ʻʼ‘’`']/g, '')
    .replace(/gʻ|g'/g, 'g')
    .replace(/oʻ|o'/g, 'o')
    .replace(/\s+/g, ' ')
    .trim()
}

export type ColumnMap = Partial<Record<keyof typeof PATIENT_EXCEL_COLUMNS, number>>

export interface ColumnResult {
  columns: ColumnMap
  /// Majburiy ustun topilmasa — nomi
  missing?: string
}

export function detectColumns(header: CellValue[]): ColumnResult {
  const keys = header.map(headerKey)
  const columns: ColumnMap = {}

  for (const [field, aliases] of Object.entries(ALIASES) as [keyof ColumnMap, string[]][]) {
    const index = keys.findIndex((key) => aliases.includes(key))
    if (index >= 0) columns[field] = index
  }

  if (columns.fio === undefined) {
    return { columns, missing: PATIENT_EXCEL_COLUMNS.fio }
  }
  return { columns }
}

export interface ParsedPatient {
  id: string | null
  fio: string
  phone: string | null
  birthDate: string | null
  address: string | null
  note: string | null
}

export interface ParsedRow {
  /// Fayldagi qator raqami — foydalanuvchi uni Excelda topa olsin
  row: number
  values: ParsedPatient
  /// Maydon nomi → oʻzbekcha xato. Boʻsh boʻlsa qator toʻgʻri
  errors: Record<string, string>
}

const OLDEST_YEAR = 1900
/// Excel sanani 1900-yil 1-yanvardan boshlab seriya raqami sifatida saqlaydi.
/// 1900-yil kabisa emas, lekin Excel uni kabisa deb hisoblaydi — shuning
/// uchun boshlangʻich nuqta 1899-12-30
const EXCEL_EPOCH = Date.UTC(1899, 11, 30)
const MS_PER_DAY = 86_400_000

function text(value: CellValue): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).trim()
}

/// Excel sanani uch xil koʻrinishda beradi: Date obyekti, seriya raqami
/// yoki matn. Uchalasini ham oʻqiymiz
export function parseDate(value: CellValue): { iso: string | null; error?: string } {
  if (value === null || value === undefined || value === '') return { iso: null }

  if (value instanceof Date) {
    return { iso: value.toISOString().slice(0, 10) }
  }

  if (typeof value === 'number') {
    if (value < 1 || value > 100_000) return { iso: null, error: IMPORT_TEXT.date_invalid }
    const date = new Date(EXCEL_EPOCH + value * MS_PER_DAY)
    return checkRange(date.toISOString().slice(0, 10))
  }

  const raw = String(value).trim()
  // Kun/oy/yil — bizda hamma joyda shu tartib
  const match = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(raw)
  if (match) {
    const [, day, month, year] = match
    return checkRange(`${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`)
  }
  // Excel baʼzan ISO matn beradi
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return checkRange(raw)

  return { iso: null, error: IMPORT_TEXT.date_invalid }
}

function checkRange(iso: string): { iso: string | null; error?: string } {
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return { iso: null, error: IMPORT_TEXT.date_invalid }
  if (date > new Date()) return { iso: null, error: IMPORT_TEXT.date_future }
  if (date.getUTCFullYear() < OLDEST_YEAR) return { iso: null, error: IMPORT_TEXT.date_old }
  return { iso }
}

/// Excel «0901234567» dagi boshidagi nolni yeb qoʻyadi. Raqam 9 xonadan
/// kam boʻlsa oldiga nol qoʻshib koʻramiz (tz.md 8-boʻlim)
export function parsePhone(value: CellValue): { phone: string | null; error?: string } {
  const raw = text(value)
  if (!raw) return { phone: null }

  const direct = normalizePhone(raw)
  if (direct) return { phone: direct }

  const digits = phoneDigits(raw)
  if (digits.length === 8) {
    const restored = normalizePhone(`0${digits}`)
    if (restored) return { phone: restored }
  }

  return { phone: null, error: IMPORT_TEXT.phone_invalid }
}

export function parseRow(row: CellValue[], columns: ColumnMap, rowNumber: number): ParsedRow {
  const at = (field: keyof ColumnMap): CellValue =>
    columns[field] === undefined ? null : (row[columns[field] as number] ?? null)

  const errors: Record<string, string> = {}

  const fio = text(at('fio')).replace(/\s+/g, ' ')
  if (!fio) errors.fio = IMPORT_TEXT.fio_required
  else if (fio.length < 3) errors.fio = IMPORT_TEXT.fio_short

  const phone = parsePhone(at('phone'))
  if (phone.error) errors.phone = phone.error

  const birth = parseDate(at('birthDate'))
  if (birth.error) errors.birthDate = birth.error

  return {
    row: rowNumber,
    values: {
      id: text(at('id')) || null,
      fio,
      phone: phone.phone,
      birthDate: birth.iso,
      address: text(at('address')) || null,
      note: text(at('note')) || null,
    },
    errors,
  }
}

/// Oddiy CSV tahlilchisi: qoʻshtirnoq ichidagi ajratgich va yangi qator,
/// ikkilangan qoʻshtirnoq («""») hisobga olinadi.
///
/// Ajratgich oʻzi tanlanadi: oʻzbek Excel koʻpincha nuqtali vergul ishlatadi
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, '')
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  // Butunlay boʻsh qatorlarni tashlaymiz
  return rows.filter((line) => line.some((cell) => cell.trim() !== ''))
}
