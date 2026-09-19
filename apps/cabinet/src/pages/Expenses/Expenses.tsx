import {
  CARD_UI,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_UI,
  formatMonth,
  formatSom,
  todayISO,
} from '@e-dentist/shared'
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
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { type Expense, useExpenses } from '@/entities/expense'
import { ExpenseFormDialog, useDeleteExpense } from '@/features/expense-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  DataTable,
  DataTablePagination,
  DataTableViewOptions,
  Skeleton,
} from '@/shared/ui'
import { expenseColumns } from './columns'

const thisMonth = () => todayISO().slice(0, 7)

function shiftMonth(month: string, by: number): string {
  const [year, index] = month.split('-').map(Number) as [number, number]
  const date = new Date(year, index - 1 + by, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function Expenses() {
  const [month, setMonth] = useState(thisMonth)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | undefined>(undefined)
  const [deleting, setDeleting] = useState<Expense | null>(null)

  const { data, isPending } = useExpenses(month)

  // Bitta oy — maʼlumot toʻliq keladi, shuning uchun saralash, filtr va
  // sahifalash mijozda
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  const table = useReactTable({
    data: data?.items ?? [],
    columns: expenseColumns({
      onEdit: (expense) => {
        setEditing(expense)
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

  const { mutateAsync: remove } = useDeleteExpense()

  // Shu oyda — bugun, oʻtgan oyda — oyning birinchi kuni. Xarajat kelajakda
  // boʻlmaydi, shuning uchun keyingi oylarda ham bugungi sana qoʻyiladi
  const firstDay = `${month}-01`
  const defaultDate = month === thisMonth() || firstDay > todayISO() ? todayISO() : firstDay

  function openNew() {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{EXPENSE_UI.title}</h1>
          <p className="text-muted-foreground text-sm">{EXPENSE_UI.subtitle}</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <PlusIcon />
          {EXPENSE_UI.add}
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={EXPENSE_UI.prev_month}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <ChevronLeftIcon />
        </Button>
        <span className="min-w-36 text-center font-semibold">{formatMonth(month)}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={EXPENSE_UI.next_month}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <ChevronRightIcon />
        </Button>
        {month !== thisMonth() && (
          <Button variant="outline" size="sm" onClick={() => setMonth(thisMonth())}>
            {EXPENSE_UI.this_month}
          </Button>
        )}
        <div className="ml-auto">
          {/* Yuklanayotganda «0 soʻm» koʻrsatilmasin — bu yolgʻon raqam */}
          {data ? (
            <Badge variant="secondary" className="text-sm">
              {EXPENSE_UI.total}: {formatSom(data.total)}
            </Badge>
          ) : (
            <Skeleton className="h-6 w-36" />
          )}
        </div>
      </div>

      {data && data.byCategory.length > 0 && (
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {data.byCategory.slice(0, 4).map((row) => (
            <Card key={row.category} className="gap-1 p-3">
              <div className="text-muted-foreground text-xs">
                {EXPENSE_CATEGORY_LABELS[row.category]}
              </div>
              <div className="text-lg font-semibold tabular-nums">{formatSom(row.total)}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Turkum va izoh filtrlari — jadval sarlavhasi ostida */}
      <div className="mb-3 flex items-center justify-end gap-2">
        <DataTableViewOptions table={table} />
      </div>

      <DataTable table={table} loading={isPending && !data} emptyText={EXPENSE_UI.empty} />

      <div className="mt-3">
        <DataTablePagination table={table} />
      </div>

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultDate={defaultDate}
        expense={editing}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{EXPENSE_UI.delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{EXPENSE_UI.delete_text}</AlertDialogDescription>
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
