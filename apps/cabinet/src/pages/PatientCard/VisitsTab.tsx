import { CARD_UI, formatSom } from '@e-dentist/shared'
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
import { useVisits, type Visit } from '@/entities/visit'
import { useDeleteVisit, VisitFormDialog } from '@/features/visit-form'
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
} from '@/shared/ui'
import { visitColumns } from './visitColumns'

export function VisitsTab({ patientId }: { patientId: string }) {
  // Bitta bemorning tashriflari toʻliq keladi — saralash va sahifalash mijozda
  const { data: visits, isPending } = useVisits(patientId)
  const { mutateAsync: removeVisit } = useDeleteVisit()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Visit | undefined>(undefined)
  const [deleting, setDeleting] = useState<Visit | null>(null)

  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data: visits ?? [],
    columns: visitColumns({
      onEdit: (visit) => {
        setEditing(visit)
        setFormOpen(true)
      },
      onRemove: setDeleting,
    }),
    state: { sorting, columnVisibility, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Jami — barcha tashriflar boʻyicha, sahifadagilar emas
  const total = visits?.reduce((sum, visit) => sum + visit.price, 0) ?? 0

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {CARD_UI.total}: <span className="text-foreground font-semibold">{formatSom(total)}</span>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <PlusIcon />
          {CARD_UI.add_visit}
        </Button>
      </div>

      <DataTable table={table} loading={isPending && !visits} emptyText={CARD_UI.no_visits} />

      {(visits?.length ?? 0) > 0 && (
        <div className="mt-3">
          <DataTablePagination table={table} />
        </div>
      )}

      <VisitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patientId={patientId}
        visit={editing}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{CARD_UI.delete_visit_title}</AlertDialogTitle>
            <AlertDialogDescription>{CARD_UI.delete_visit_text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleting) await removeVisit(deleting.id)
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
