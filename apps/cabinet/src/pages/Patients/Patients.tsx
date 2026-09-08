import {
  age,
  EXCEL_UI,
  formatDate,
  formatUzPhone,
  IMPORT_UI,
  PATIENT_UI,
  UI_TEXT,
} from '@e-dentist/shared'
import { FileDownIcon, PencilIcon, PlusIcon, SheetIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type Patient, usePatients } from '@/entities/patient'
import { PatientFormDialog, useDeletePatient } from '@/features/patient-form'
import { PatientImportDialog } from '@/features/patient-import'
import { ApiError, downloadFile } from '@/shared/api'
import { useDebounced } from '@/shared/lib'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  EmptyState,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'

const PAGE_SIZE = 20

type Download = 'template' | 'export' | null

export function Patients() {
  const [busy, setBusy] = useState<Download>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  async function download(what: Exclude<Download, null>) {
    setBusy(what)
    setDownloadError('')
    try {
      await downloadFile(what === 'template' ? '/patients/import/template' : '/patients/export')
    } catch (error) {
      setDownloadError(error instanceof ApiError ? error.message : UI_TEXT.offline)
    } finally {
      setBusy(null)
    }
  }

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const [editing, setEditing] = useState<Patient | undefined>(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [removing, setRemoving] = useState<Patient | null>(null)

  const { data, isPending } = usePatients({
    q: debouncedSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
  })
  const { mutateAsync: remove, isPending: isRemoving } = useDeletePatient()

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  function openNew() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(patient: Patient) {
    setEditing(patient)
    setFormOpen(true)
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{PATIENT_UI.title}</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => download('template')}
          >
            <FileDownIcon />
            {busy === 'template' ? EXCEL_UI.downloading : EXCEL_UI.template}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <UploadIcon />
            {IMPORT_UI.title}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => download('export')}
          >
            <SheetIcon />
            {busy === 'export' ? EXCEL_UI.downloading : EXCEL_UI.export}
          </Button>
          <Button onClick={openNew}>
            <PlusIcon />
            {PATIENT_UI.add}
          </Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder={PATIENT_UI.search}
          className="max-w-sm"
        />
        {data && (
          <span className="text-muted-foreground text-sm">{PATIENT_UI.total(data.total)}</span>
        )}
      </div>

      {downloadError && (
        <p className="text-destructive mb-3 text-sm font-medium">{downloadError}</p>
      )}
      <Card className="gap-0 overflow-hidden p-0">
        {isPending && !data ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : data && data.items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{PATIENT_UI.col_fio}</TableHead>
                <TableHead>{PATIENT_UI.col_phone}</TableHead>
                <TableHead>{PATIENT_UI.col_age}</TableHead>
                <TableHead>{PATIENT_UI.col_address}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((patient) => {
                const years = patient.birthDate ? age(patient.birthDate.slice(0, 10)) : null
                return (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {patient.fio}
                      </Link>
                    </TableCell>
                    <TableCell>{patient.phone ? formatUzPhone(patient.phone) : '—'}</TableCell>
                    <TableCell>
                      {years === null ? '—' : PATIENT_UI.years(years)}
                      {patient.birthDate && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          {formatDate(patient.birthDate.slice(0, 10))}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {patient.address ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={PATIENT_UI.edit_title}
                        onClick={() => openEdit(patient)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={PATIENT_UI.remove}
                        onClick={() => setRemoving(patient)}
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon="👥"
            text={debouncedSearch ? PATIENT_UI.nothing_found : PATIENT_UI.empty}
          />
        )}
      </Card>

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            {PATIENT_UI.prev}
          </Button>
          <span className="text-muted-foreground text-sm">{PATIENT_UI.page_of(page, pages)}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            {PATIENT_UI.next}
          </Button>
        </div>
      )}

      <PatientImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <PatientFormDialog open={formOpen} onOpenChange={setFormOpen} patient={editing} />

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{PATIENT_UI.remove_title}</AlertDialogTitle>
            <AlertDialogDescription>
              {removing && PATIENT_UI.remove_text(removing.fio)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{PATIENT_UI.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemoving}
              onClick={async () => {
                if (removing) await remove(removing.id)
                setRemoving(null)
              }}
            >
              {isRemoving ? PATIENT_UI.removing : PATIENT_UI.remove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
