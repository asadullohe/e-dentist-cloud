import {
  CARD_UI,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_UI,
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
import { PlusIcon } from 'lucide-react'
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
  Button,
  Card,
  DataTable,
  DataTablePagination,
  DataTableViewOptions,
  MonthNav,
  Skeleton,
} from '@/shared/ui'
import { expenseColumns } from './columns'

const thisMonth = () => todayISO().slice(0, 7)

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
        <Button size="sm" className="w-full sm:w-auto" onClick={openNew}>
          <PlusIcon />
          {EXPENSE_UI.add}
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <MonthNav month={month} onChange={setMonth} />
        {/* Oy jamisi: telefonda butun qator (nom chapda, summa oʻngda), keng
            ekranda oʻng chetda. Yuklanayotganda «0 soʻm» emas — skelet */}
        <div className="bg-muted flex w-full items-center justify-between gap-3 rounded-md px-3 py-1.5 text-sm sm:ml-auto sm:w-auto">
          <span className="text-muted-foreground">{EXPENSE_UI.total}</span>
          {data ? (
            <span className="font-semibold tabular-nums">{formatSom(data.total)}</span>
          ) : (
            <Skeleton className="h-4 w-24" />
          )}
        </div>
      </div>

      {data && data.byCategory.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {data.byCategory.slice(0, 4).map((row) => (
            <Card key={row.category} className="min-w-0 gap-0.5 p-3 sm:gap-1">
              <div className="text-muted-foreground truncate text-xs">
                {EXPENSE_CATEGORY_LABELS[row.category]}
              </div>
              <div className="truncate text-base font-semibold tabular-nums sm:text-lg">
                {formatSom(row.total)}
              </div>
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
