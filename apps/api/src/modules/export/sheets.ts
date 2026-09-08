// Eksport varaqlari. Har bir jadval alohida .xlsx fayl boʻladi —
// bitta ulkan fayldan koʻra ochish oson.

import {
  APPOINTMENT_STATUS_LABELS,
  EXPENSE_CATEGORY_LABELS,
  EXPORT_COLUMNS,
  formatDate,
  formatDateTime,
  LAB_MATERIAL_LABELS,
  LAB_STATUS_LABELS,
  LAB_WORK_TYPE_LABELS,
} from '@e-dentist/shared'
import { crownMaterialLabel, toothStatusLabel } from '@e-dentist/teeth'
import writeXlsxFile, { type SheetData } from 'write-excel-file/node'

const HEADER = { fontWeight: 'bold' as const }

type Cell = string | number | null

function sheet(headers: string[], rows: Cell[][]): SheetData {
  return [
    headers.map((value) => ({ value, ...HEADER, type: String })),
    ...rows.map((row) =>
      row.map((value) =>
        typeof value === 'number'
          ? { value, type: Number, format: '#,##0' }
          : { value: value ?? '', type: String },
      ),
    ),
  ] as SheetData
}

/// Bitta varaqli fayl. Nomi ekranda koʻrinadigan sarlavha boʻladi
export function toBuffer(name: string, data: SheetData, widths: number[]): Promise<Buffer> {
  return writeXlsxFile([
    { data, sheet: name, columns: widths.map((width) => ({ width })) },
  ]).toBuffer()
}

const iso = (date: Date) => formatDate(date.toISOString().slice(0, 10))

export interface Named {
  id: string
  fio: string
}

export function nameOf(people: Map<string, string>, patientId: string): string {
  return people.get(patientId) ?? ''
}

export function visitsSheet(
  rows: {
    patientId: string
    date: Date
    treatment: string
    tooth: number | null
    price: number
    note: string | null
  }[],
  people: Map<string, string>,
): SheetData {
  return sheet(
    [
      EXPORT_COLUMNS.date,
      EXPORT_COLUMNS.patient,
      EXPORT_COLUMNS.treatment,
      EXPORT_COLUMNS.tooth,
      EXPORT_COLUMNS.price,
      EXPORT_COLUMNS.note,
    ],
    rows.map((row) => [
      iso(row.date),
      nameOf(people, row.patientId),
      row.treatment,
      row.tooth,
      row.price,
      row.note,
    ]),
  )
}

export function teethSheet(
  rows: {
    patientId: string
    tooth: number
    status: string
    material: string | null
    note: string | null
  }[],
  people: Map<string, string>,
): SheetData {
  return sheet(
    [
      EXPORT_COLUMNS.patient,
      EXPORT_COLUMNS.tooth,
      EXPORT_COLUMNS.status,
      EXPORT_COLUMNS.material,
      EXPORT_COLUMNS.note,
    ],
    rows.map((row) => [
      nameOf(people, row.patientId),
      row.tooth,
      toothStatusLabel(row.status),
      crownMaterialLabel(row.material),
      row.note,
    ]),
  )
}

export function bridgesSheet(
  rows: { patientId: string; teeth: number[]; material: string | null }[],
  people: Map<string, string>,
): SheetData {
  return sheet(
    [EXPORT_COLUMNS.patient, EXPORT_COLUMNS.teeth, EXPORT_COLUMNS.material],
    [
      ...rows.map((row) => [
        nameOf(people, row.patientId),
        row.teeth.join(', '),
        crownMaterialLabel(row.material),
      ]),
    ],
  )
}

export function paymentsSheet(
  rows: { patientId: string; date: Date; amount: number; note: string | null }[],
  people: Map<string, string>,
): SheetData {
  return sheet(
    [EXPORT_COLUMNS.date, EXPORT_COLUMNS.patient, EXPORT_COLUMNS.amount, EXPORT_COLUMNS.note],
    rows.map((row) => [iso(row.date), nameOf(people, row.patientId), row.amount, row.note]),
  )
}

export function appointmentsSheet(
  rows: { patientId: string; at: Date; status: string; note: string | null }[],
  people: Map<string, string>,
): SheetData {
  return sheet(
    [EXPORT_COLUMNS.date, EXPORT_COLUMNS.patient, EXPORT_COLUMNS.status, EXPORT_COLUMNS.note],
    rows.map((row) => [
      formatDateTime(row.at),
      nameOf(people, row.patientId),
      APPOINTMENT_STATUS_LABELS[row.status as keyof typeof APPOINTMENT_STATUS_LABELS] ?? row.status,
      row.note,
    ]),
  )
}

export function expensesSheet(
  rows: { date: Date; category: string; description: string; amount: number }[],
): SheetData {
  return sheet(
    [EXPORT_COLUMNS.date, EXPORT_COLUMNS.category, EXPORT_COLUMNS.note, EXPORT_COLUMNS.amount],
    rows.map((row) => [
      iso(row.date),
      EXPENSE_CATEGORY_LABELS[row.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? row.category,
      row.description,
      row.amount,
    ]),
  )
}

export function labSheet(
  rows: {
    patientId: string
    dueDate: Date
    workType: string
    material: string
    shade: string | null
    teeth: number[]
    techPrice: number
    status: string
    returns: number
    note: string | null
  }[],
  people: Map<string, string>,
  techNames: Map<string, string>,
  techOf: (index: number) => string | null,
): SheetData {
  return sheet(
    [
      EXPORT_COLUMNS.due,
      EXPORT_COLUMNS.patient,
      EXPORT_COLUMNS.work_type,
      EXPORT_COLUMNS.material,
      EXPORT_COLUMNS.shade,
      EXPORT_COLUMNS.teeth,
      EXPORT_COLUMNS.tech,
      EXPORT_COLUMNS.tech_price,
      EXPORT_COLUMNS.status,
      EXPORT_COLUMNS.returns,
      EXPORT_COLUMNS.note,
    ],
    rows.map((row, index) => {
      const techId = techOf(index)
      return [
        iso(row.dueDate),
        nameOf(people, row.patientId),
        LAB_WORK_TYPE_LABELS[row.workType as keyof typeof LAB_WORK_TYPE_LABELS] ?? row.workType,
        LAB_MATERIAL_LABELS[row.material as keyof typeof LAB_MATERIAL_LABELS] ?? row.material,
        row.shade,
        row.teeth.join(', '),
        techId ? (techNames.get(techId) ?? '') : '',
        row.techPrice,
        LAB_STATUS_LABELS[row.status as keyof typeof LAB_STATUS_LABELS] ?? row.status,
        row.returns,
        row.note,
      ]
    }),
  )
}

export function servicesSheet(rows: { name: string; price: number }[]): SheetData {
  return sheet(
    [EXPORT_COLUMNS.service, EXPORT_COLUMNS.price],
    rows.map((row) => [row.name, row.price]),
  )
}
