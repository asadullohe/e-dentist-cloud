import { apiRequest } from '@/shared/api'

export interface ImportRow {
  row: number
  values: {
    id: string | null
    fio: string
    phone: string | null
    birthDate: string | null
    address: string | null
    note: string | null
  }
  errors: Record<string, string>
  duplicateOf: string | null
}

export interface ImportPreview {
  token: string
  totalRows: number
  validCount: number
  errorCount: number
  duplicateCount: number
  rows: ImportRow[]
}

export interface ImportResult {
  added: number
  updated: number
  skipped: number
  errorCount: number
  errorsToken: string | null
}

export type DuplicateMode = 'skip' | 'update' | 'add'

export function previewImport(file: File, hasHeader: boolean) {
  const form = new FormData()
  form.append('hasHeader', String(hasHeader))
  form.append('file', file)
  return apiRequest<ImportPreview>('/patients/import/preview', { method: 'POST', body: form })
}

export const commitImport = (token: string, mode: DuplicateMode) =>
  apiRequest<ImportResult>('/patients/import/commit', { method: 'POST', body: { token, mode } })

export const errorsPath = (token: string) => `/patients/import/errors/${token}`
