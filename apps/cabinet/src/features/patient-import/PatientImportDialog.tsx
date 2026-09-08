import { formatDate, IMPORT_UI, UI_TEXT } from '@e-dentist/shared'
import { cn } from 'cn'
import { FileSpreadsheetIcon } from 'lucide-react'
import { type ChangeEvent, useRef, useState } from 'react'
import { ApiError, downloadFile } from '@/shared/api'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import type { DuplicateMode, ImportResult } from './api'
import { errorsPath } from './api'
import { useCommitImport, usePreviewImport } from './hooks'

const MODES: { value: DuplicateMode; label: string }[] = [
  { value: 'skip', label: IMPORT_UI.mode_skip },
  { value: 'update', label: IMPORT_UI.mode_update },
  { value: 'add', label: IMPORT_UI.mode_add },
]

interface PatientImportDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
}

export function PatientImportDialog({ open, onOpenChange }: PatientImportDialogProps) {
  const preview = usePreviewImport()
  const commit = useCommitImport()
  const fileInput = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [hasHeader, setHasHeader] = useState(true)
  const [mode, setMode] = useState<DuplicateMode>('skip')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  function reset() {
    setFile(null)
    setResult(null)
    setError('')
    preview.reset()
  }

  async function read(picked: File, header: boolean) {
    setError('')
    setResult(null)
    try {
      await preview.mutateAsync({ file: picked, hasHeader: header })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  async function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return
    setFile(picked)
    await read(picked, hasHeader)
  }

  // Sarlavha belgisi oʻzgarsa fayl qaytadan tahlil qilinadi:
  // ustunlar boshqacha tanaladi
  async function toggleHeader(next: boolean) {
    setHasHeader(next)
    if (file) await read(file, next)
  }

  async function start() {
    if (!preview.data) return
    setError('')
    try {
      setResult(await commit.mutateAsync({ token: preview.data.token, mode }))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  const data = preview.data

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{IMPORT_UI.title}</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <p className="font-medium">{IMPORT_UI.done}</p>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>{IMPORT_UI.added(result.added)}</li>
              <li>{IMPORT_UI.updated(result.updated)}</li>
              <li>{IMPORT_UI.skipped(result.skipped)}</li>
            </ul>
            {result.errorsToken && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(errorsPath(result.errorsToken as string))}
              >
                <FileSpreadsheetIcon />
                {IMPORT_UI.download_errors}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={preview.isPending}
                onClick={() => fileInput.current?.click()}
              >
                <FileSpreadsheetIcon />
                {preview.isPending ? IMPORT_UI.reading : IMPORT_UI.pick_file}
              </Button>
              <input ref={fileInput} type="file" accept=".xlsx,.csv" hidden onChange={pickFile} />
              {file && <span className="text-muted-foreground text-sm">{file.name}</span>}

              <div className="flex items-center gap-2">
                <Checkbox
                  id="import-has-header"
                  checked={hasHeader}
                  onCheckedChange={(checked) => toggleHeader(checked === true)}
                />
                <Label htmlFor="import-has-header" className="text-sm font-normal">
                  {IMPORT_UI.has_header}
                </Label>
              </div>
            </div>

            {error && <p className="text-destructive text-sm font-medium">{error}</p>}

            {data && (
              <>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span>{IMPORT_UI.total(data.totalRows)}</span>
                  <span className="text-ok">{IMPORT_UI.valid(data.validCount)}</span>
                  {data.errorCount > 0 && (
                    <span className="text-destructive">{IMPORT_UI.errors(data.errorCount)}</span>
                  )}
                  {data.duplicateCount > 0 && (
                    <span className="text-warn">{IMPORT_UI.duplicates(data.duplicateCount)}</span>
                  )}
                </div>

                <div className="max-h-72 overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">{IMPORT_UI.row_column}</TableHead>
                        <TableHead>F.I.O.</TableHead>
                        <TableHead className="w-40">Telefon</TableHead>
                        <TableHead className="w-28">Sana</TableHead>
                        <TableHead>{IMPORT_UI.error_column}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.rows.map((row) => {
                        const messages = Object.values(row.errors)
                        return (
                          <TableRow
                            key={row.row}
                            className={cn(messages.length > 0 && 'bg-destructive/5')}
                          >
                            <TableCell className="tabular-nums">{row.row}</TableCell>
                            <TableCell>{row.values.fio}</TableCell>
                            <TableCell className="tabular-nums">
                              {row.values.phone ?? '—'}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {row.values.birthDate ? formatDate(row.values.birthDate) : '—'}
                            </TableCell>
                            <TableCell className="text-destructive text-xs">
                              {messages.join('; ')}
                              {messages.length === 0 && row.duplicateOf && (
                                <span className="text-warn">{IMPORT_UI.duplicate_label}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {data.totalRows > data.rows.length && (
                  <p className="text-muted-foreground text-xs">{IMPORT_UI.preview_note}</p>
                )}

                {data.duplicateCount > 0 && (
                  <div className="space-y-1.5">
                    <Label>{IMPORT_UI.duplicate_mode}</Label>
                    <div className="flex flex-wrap gap-2">
                      {MODES.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          size="sm"
                          variant={mode === option.value ? 'default' : 'outline'}
                          onClick={() => setMode(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {result ? IMPORT_UI.close : IMPORT_UI.cancel}
          </Button>
          {!result && (
            <Button
              type="button"
              disabled={!data || data.validCount === 0 || commit.isPending}
              onClick={start}
            >
              {commit.isPending ? IMPORT_UI.committing : IMPORT_UI.commit}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
