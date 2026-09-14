import { CARD_UI, LAB_STATUS_LABELS, LAB_UI } from '@e-dentist/shared'
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type LabOrder, type LabStatus, useLabOrders } from '@/entities/lab-order'
import { useHasPermission } from '@/entities/session'
import { useStaffNames } from '@/entities/staff'
import {
  LabFormDialog,
  ReturnDialog,
  useDeleteLabOrder,
  useSetLabStatus,
} from '@/features/lab-form'
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
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableViewOptions,
} from '@/shared/ui'
import { labColumns } from './columns'

const STATUSES = Object.keys(LAB_STATUS_LABELS) as LabStatus[]

/// Qator foni holatga qarab: topshirilgan — yashil, muddati oʻtgan — qizil,
/// tayyor — sariq. Jadvalda koʻz bilan ajratish uchun
function rowTone(order: LabOrder): string | undefined {
  if (order.status === 'delivered') return 'bg-ok/5'
  if (order.overdue) return 'bg-destructive/5'
  if (order.status === 'ready') return 'bg-warn/10'
  return undefined
}

export function Lab() {
  const navigate = useNavigate()
  const hasPermission = useHasPermission()
  const canWrite = hasPermission('lab.write')
  const canSeePrice = hasPermission('lab.cost')
  // Texnikda patients.read yoʻq — unga kartochka ochilmaydi, qator bosilmaydi
  const canOpenPatient = hasPermission('patients.read')

  // Roʻyxat toʻliq keladi (texnik faqat oʻzinikini koʻradi — server
  // cheklaydi), shuning uchun filtr, saralash va sahifalash mijozda
  const { data: orders, isPending } = useLabOrders({})
  const { data: staff } = useStaffNames()
  const { mutateAsync: setLabStatus } = useSetLabStatus()
  const { mutateAsync: remove } = useDeleteLabOrder()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LabOrder | undefined>(undefined)
  const [returning, setReturning] = useState<LabOrder | null>(null)
  const [deleting, setDeleting] = useState<LabOrder | null>(null)

  const [sorting, setSorting] = useState<SortingState>([{ id: 'dueDate', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  const table = useReactTable({
    data: orders ?? [],
    columns: labColumns({
      canWrite,
      canSeePrice,
      onReady: (order) => void setLabStatus({ id: order.id, status: 'ready' }),
      onDelivered: (order) => void setLabStatus({ id: order.id, status: 'delivered' }),
      onReturn: setReturning,
      onEdit: (order) => {
        setEditing(order)
        setFormOpen(true)
      },
      onRemove: setDeleting,
    }),
    state: { sorting, columnFilters, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const filterValue = (id: string) =>
    (table.getColumn(id)?.getFilterValue() as string[] | undefined) ?? []
  const setFilter = (id: string, values: string[]) =>
    table.getColumn(id)?.setFilterValue(values.length ? values : undefined)

  const statusCounts = new Map<string, number>()
  for (const order of orders ?? []) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1)
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{LAB_UI.title}</h1>
        {canWrite && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <PlusIcon />
            {LAB_UI.add}
          </Button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <DataTableFacetedFilter
          title={LAB_UI.status}
          options={STATUSES.map((key) => ({ value: key, label: LAB_STATUS_LABELS[key] }))}
          selected={filterValue('status')}
          onChange={(values) => setFilter('status', values)}
          counts={statusCounts}
        />
        {canWrite && staff && (
          <DataTableFacetedFilter
            title={LAB_UI.tech}
            options={staff.map((person) => ({
              value: person.id,
              label: person.fullName ?? person.id,
            }))}
            selected={filterValue('tech')}
            onChange={(values) => setFilter('tech', values)}
          />
        )}
        <DataTableViewOptions table={table} />
      </div>

      <DataTable
        table={table}
        loading={isPending && !orders}
        emptyText={LAB_UI.empty}
        rowClassName={rowTone}
        onRowClick={
          canOpenPatient ? (order) => navigate(`/patients/${order.patientId}/texnik`) : undefined
        }
      />

      <div className="mt-3">
        <DataTablePagination table={table} />
      </div>

      <LabFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        order={editing}
        canSeePrice={canSeePrice}
      />

      <ReturnDialog order={returning} onOpenChange={(open) => !open && setReturning(null)} />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{LAB_UI.delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{LAB_UI.delete_text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleting) await remove(deleting.id)
                setDeleting(null)
              }}
            >
              {CARD_UI.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
