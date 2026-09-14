import { CARD_UI, SERVICE_UI, TABLE_UI } from '@e-dentist/shared'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { PlusIcon, SearchIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { type Service, useServices } from '@/entities/service'
import { ServiceFormDialog, useDeleteService } from '@/features/service-form'
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
  Input,
} from '@/shared/ui'
import { serviceColumns } from './columns'

export function Services() {
  const { data: services, isPending } = useServices()
  const { mutateAsync: remove } = useDeleteService()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Service | undefined>(undefined)
  const [deleting, setDeleting] = useState<Service | null>(null)

  // Narxnoma toʻliq keladi — qidiruv, saralash va sahifalash mijozda
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  const table = useReactTable({
    data: services ?? [],
    columns: serviceColumns({
      onEdit: (service) => {
        setEditing(service)
        setFormOpen(true)
      },
      onRemove: setDeleting,
    }),
    state: { sorting, pagination, globalFilter: search },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setSearch,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  function onSearch(value: string) {
    setSearch(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{SERVICE_UI.title}</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <PlusIcon />
          {SERVICE_UI.add}
        </Button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={SERVICE_UI.search}
            className="h-8 pl-8"
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onSearch('')}>
            {TABLE_UI.reset}
            <XIcon />
          </Button>
        )}
      </div>

      <DataTable
        table={table}
        loading={isPending && !services}
        emptyText={search ? SERVICE_UI.nothing_found : SERVICE_UI.empty}
      />

      <div className="mt-3">
        <DataTablePagination table={table} />
      </div>

      <ServiceFormDialog open={formOpen} onOpenChange={setFormOpen} service={editing} />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{SERVICE_UI.delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{SERVICE_UI.delete_text}</AlertDialogDescription>
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
