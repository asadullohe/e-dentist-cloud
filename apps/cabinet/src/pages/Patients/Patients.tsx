import { EXCEL_UI, IMPORT_UI, PATIENT_UI, TABLE_UI, todayISO, UI_TEXT } from '@e-dentist/shared'
import {
  type ColumnFiltersState,
  getCoreRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  FileDownIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  SheetIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Patient, type PatientSort, usePatients } from '@/entities/patient'
import { useHasPermission } from '@/entities/session'
import { useDoctors } from '@/entities/staff'
import { AppointmentFormDialog } from '@/features/appointment-form'
import { PatientFormDialog, useDeletePatient } from '@/features/patient-form'
import { PatientImportDialog } from '@/features/patient-import'
import { useEnqueue } from '@/features/queue-manage'
import { ApiError, downloadFile } from '@/shared/api'
import { useDebounced, useElementHeight } from '@/shared/lib'
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
  DataTable,
  DataTablePagination,
  DataTableViewOptions,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@/shared/ui'
import { patientColumns } from './columns'

/// Tepa panel balandligi (h-14) — yopishqoq bloklar shundan boshlanadi
const HEADER_HEIGHT = 56

type Download = 'template' | 'export' | null

export function Patients() {
  const navigate = useNavigate()
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
  const debouncedSearch = useDebounced(search)

  // Jadval holati mijozda, maʼlumot serverda: sahifa va saralash
  // parametrlari soʻrovga ketadi (manualPagination / manualSorting)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fio', desc: false }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [editing, setEditing] = useState<Patient | undefined>(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [removing, setRemoving] = useState<Patient | null>(null)

  const sort = sorting[0]
  // thead dagi ustun filtrlari — server sahifalagani uchun soʻrovga ketadi
  const filterOf = (id: string) =>
    columnFilters.find((f) => f.id === id)?.value as string | undefined
  const ageRange = columnFilters.find((f) => f.id === 'birthDate')?.value as
    | [number | undefined, number | undefined]
    | undefined
  const { data, isPending, isFetching } = usePatients({
    q: debouncedSearch || undefined,
    phone: filterOf('phone'),
    address: filterOf('address'),
    doctorId: filterOf('doctorId'),
    ageFrom: ageRange?.[0],
    ageTo: ageRange?.[1],
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sort: (sort?.id as PatientSort | undefined) ?? 'fio',
    dir: sort?.desc ? 'desc' : 'asc',
  })
  const { mutateAsync: remove, isPending: isRemoving } = useDeletePatient()
  const { mutate: enqueue } = useEnqueue()
  const hasPermission = useHasPermission()
  const canEnqueue = hasPermission('queue.manage')
  // Qabulga yozish — jadvaldagi forma, bemor oldindan tanlangan
  const canBook = hasPermission('schedule.write')
  const [booking, setBooking] = useState<Patient | null>(null)
  // Kuzatuvchi roʻyxatni koʻradi va Excelga chiqaradi, lekin yozmaydi
  const canWrite = hasPermission('patients.write')
  const { data: doctors } = useDoctors()
  // Shifokor (patients.all yoʻq) roʻyxatda faqat oʻz bemorlarini koʻradi —
  // shifokor boʻyicha filtr unga maʼnosiz
  const doctorOptions = hasPermission('patients.all')
    ? (doctors ?? []).map((item) => ({ value: item.id, label: item.fullName ?? '' }))
    : []

  const table = useReactTable({
    data: data?.items ?? [],
    columns: patientColumns({
      onEdit: openEdit,
      onRemove: setRemoving,
      onBook: canBook ? setBooking : undefined,
      canEdit: canWrite,
      doctorOptions,
    }),
    pageCount: data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : -1,
    state: { pagination, sorting, columnVisibility, columnFilters },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange: setPagination,
    onSortingChange: (updater) => {
      setSorting(updater)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    getCoreRowModel: getCoreRowModel(),
  })

  function onSearch(value: string) {
    setSearch(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  function openNew() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(patient: Patient) {
    setEditing(patient)
    setFormOpen(true)
  }

  // Telefonda sarlavha, qidiruv va jadval sarlavhasi yopishib turadi —
  // uzun roʻyxatda qidirish uchun tepaga qaytish shart boʻlmasin.
  // Jadval sarlavhasi shu blok ostiga yopishadi — balandligi oʻlchanadi
  const [stickyRef, stickyHeight] = useElementHeight<HTMLDivElement>()

  return (
    <>
      <div
        ref={stickyRef}
        className="max-md:bg-background max-md:sticky max-md:top-14 max-md:z-20 max-md:-mx-4 max-md:px-4 max-md:pt-1"
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{PATIENT_UI.title}</h1>
            {data && (
              <p className="text-muted-foreground text-sm">{PATIENT_UI.total(data.total)}</p>
            )}
          </div>
          <div className="flex gap-2">
            {/* Excel amallari telefonda «⋯» menyuda — asosiy tugma bitta qoladi */}
            <div className="hidden gap-2 sm:flex">
              {canWrite && (
                <>
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
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => download('export')}
              >
                <SheetIcon />
                {busy === 'export' ? EXCEL_UI.downloading : EXCEL_UI.export}
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="sm:hidden"
                  aria-label={TABLE_UI.actions}
                  disabled={busy !== null}
                >
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {canWrite && (
                  <>
                    <DropdownMenuItem onClick={() => download('template')}>
                      <FileDownIcon />
                      {EXCEL_UI.template}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setImportOpen(true)}>
                      <UploadIcon />
                      {IMPORT_UI.title}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => download('export')}>
                  <SheetIcon />
                  {EXCEL_UI.export}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canWrite && (
              <Button size="sm" onClick={openNew}>
                <PlusIcon />
                {PATIENT_UI.add}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={PATIENT_UI.search}
              className="h-8 pl-8"
            />
          </div>
          {search && (
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onSearch('')}>
              {TABLE_UI.reset}
              <XIcon />
            </Button>
          )}
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {downloadError && (
        <p className="text-destructive mb-3 text-sm font-medium">{downloadError}</p>
      )}

      <DataTable
        table={table}
        loading={isPending && !data}
        // Eski maʼlumot koʻrsatilib turganda (qidiruv, sahifa) — jadval xira
        refreshing={isFetching}
        emptyText={
          debouncedSearch || columnFilters.length ? PATIENT_UI.nothing_found : PATIENT_UI.empty
        }
        onRowClick={(patient) => navigate(`/patients/${patient.id}`)}
        stickyTop={HEADER_HEIGHT + stickyHeight}
      />

      <div className="mt-3">
        <DataTablePagination table={table} />
      </div>

      <PatientImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <PatientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={editing}
        enqueueOption={canEnqueue}
        onCreated={(created, { enqueueToday }) => {
          // Shifokorsiz navbat boʻlmaydi — forma buni oʻzi tekshiradi
          if (enqueueToday && created.doctorId) {
            enqueue({ patientId: created.id, doctorId: created.doctorId })
          }
        }}
      />
      <AppointmentFormDialog
        open={booking !== null}
        onOpenChange={(open) => !open && setBooking(null)}
        defaultDate={todayISO()}
        patient={booking ?? undefined}
        ownOnly={!hasPermission('schedule.all')}
      />

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
