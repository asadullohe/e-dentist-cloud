// Bemorlarni Excel ga chiqarish va shablon yasash.
//
// Muhim qoida (tz.md 8-boʻlim): chiqarilgan fayl aynan shablon boʻlishi
// kerak. Ya'ni uni tahrirlab qaytadan yuklash mumkin — bu koʻp yozuvni
// birdaniga tuzatishning eng oson yoʻli.

import {
  EXCEL_TEXT,
  formatDate,
  formatUzPhone,
  IMPORT_UI,
  PATIENT_EXCEL_COLUMNS,
} from '@e-dentist/shared'
import writeXlsxFile, { type SheetData } from 'write-excel-file/node'

export interface PatientRow {
  id: string
  fio: string
  phone: string | null
  birthDate: Date | null
  address: string | null
  note: string | null
}

const HEADERS = [
  PATIENT_EXCEL_COLUMNS.id,
  PATIENT_EXCEL_COLUMNS.fio,
  PATIENT_EXCEL_COLUMNS.phone,
  PATIENT_EXCEL_COLUMNS.birthDate,
  PATIENT_EXCEL_COLUMNS.address,
  PATIENT_EXCEL_COLUMNS.note,
]

const GUIDE_WIDTHS = [{ width: 30 }, { width: 12 }, { width: 60 }]

const COLUMN_WIDTHS = [
  { width: 38 },
  { width: 28 },
  { width: 20 },
  { width: 16 },
  { width: 30 },
  { width: 34 },
]

function headerRow(): SheetData[number] {
  return HEADERS.map((value) => ({ value, fontWeight: 'bold' as const }))
}

function patientRow(patient: PatientRow): SheetData[number] {
  return [
    { value: patient.id },
    { value: patient.fio },
    // Telefon matn sifatida: Excel «+998…» ni son deb oʻqib buzmasin
    { value: patient.phone ? formatUzPhone(patient.phone) : '' },
    { value: patient.birthDate ? formatDate(patient.birthDate.toISOString().slice(0, 10)) : '' },
    { value: patient.address ?? '' },
    { value: patient.note ?? '' },
  ]
}

/// Ikkinchi varaq — qoʻllanma. Mijoz qaysi ustun majburiy va sana qanday
/// yozilishini shu yerdan koʻradi
function guideSheet(): SheetData {
  const rows: SheetData = [
    [{ value: EXCEL_TEXT.guide_title, fontWeight: 'bold' }],
    [],
    ...EXCEL_TEXT.guide_rows.map((row, index) =>
      row.map((value) => ({ value, fontWeight: index === 0 ? ('bold' as const) : undefined })),
    ),
    [],
    ...EXCEL_TEXT.guide_notes.map((note) => [{ value: note }]),
  ]
  return rows
}

/// Boʻsh shablon: toʻgʻri ustunlar va ikkita namuna qator.
/// ID ustuni ataylab boʻsh — yangi bemor qoʻshilayotganda u kerak emas
export function buildTemplate(): Promise<Buffer> {
  const samples: SheetData = [
    [
      { value: '' },
      { value: 'Karimov Aziz Akmalovich' },
      { value: '+998 90 123 45 67' },
      { value: '12/05/1990' },
      { value: 'Toshkent, Chilonzor 12' },
      { value: 'Penitsillinga allergiya' },
    ],
    [
      { value: '' },
      { value: 'Yoʻldosheva Nilufar' },
      { value: '+998 93 555 66 77' },
      { value: '03/11/1985' },
      { value: '' },
      { value: '' },
    ],
  ]

  return writeXlsxFile([
    { data: [headerRow(), ...samples], sheet: EXCEL_TEXT.sheet_patients, columns: COLUMN_WIDTHS },
    { data: guideSheet(), sheet: EXCEL_TEXT.sheet_guide, columns: GUIDE_WIDTHS },
  ]).toBuffer()
}

/// Roʻyxatni chiqarish. Ustunlar shablon bilan bir xil, ustiga `id` —
/// takrorni telefon emas, id boʻyicha aniqlash aniqroq ishlaydi
export function buildExport(patients: PatientRow[]): Promise<Buffer> {
  return writeXlsxFile([
    {
      data: [headerRow(), ...patients.map(patientRow)],
      sheet: EXCEL_TEXT.sheet_patients,
      columns: COLUMN_WIDTHS,
    },
    { data: guideSheet(), sheet: EXCEL_TEXT.sheet_guide, columns: GUIDE_WIDTHS },
  ]).toBuffer()
}

export interface ErrorRow {
  row: number
  values: {
    fio: string
    phone: string | null
    birthDate: string | null
    address: string | null
    note: string | null
  }
  errors: Record<string, string>
}

/// Xatoli qatorlar fayli. Ustunlar shablon bilan bir xil, ustiga qator
/// raqami va xato izohi — mijoz tuzatib qaytadan yuklaydi (tz.md 8-boʻlim)
export function buildErrorReport(rows: ErrorRow[]): Promise<Buffer> {
  const header = [
    { value: IMPORT_UI.row_column, fontWeight: 'bold' as const },
    { value: IMPORT_UI.error_column, fontWeight: 'bold' as const },
    ...HEADERS.slice(1).map((value) => ({ value, fontWeight: 'bold' as const })),
  ]

  const body: SheetData = rows.map((row) => [
    { value: row.row },
    { value: Object.values(row.errors).join('; ') },
    { value: row.values.fio },
    { value: row.values.phone ?? '' },
    { value: row.values.birthDate ? formatDate(row.values.birthDate) : '' },
    { value: row.values.address ?? '' },
    { value: row.values.note ?? '' },
  ])

  return writeXlsxFile([
    {
      data: [header, ...body],
      sheet: EXCEL_TEXT.sheet_patients,
      columns: [{ width: 8 }, { width: 44 }, ...COLUMN_WIDTHS.slice(1)],
    },
  ]).toBuffer()
}
