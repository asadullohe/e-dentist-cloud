import {
  CARD_UI,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_UI,
  formatDate,
  formatMonth,
  formatSom,
  todayISO,
} from '@e-dentist/shared'
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
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
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'

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
          <h1 className="font-display text-2xl font-bold tracking-tight">{EXPENSE_UI.title}</h1>
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
        <span className="font-display min-w-36 text-center font-semibold">
          {formatMonth(month)}
        </span>
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
          <Badge variant="secondary" className="text-sm">
            {EXPENSE_UI.total}: {formatSom(data?.total ?? 0)}
          </Badge>
        </div>
      </div>

      {data && data.byCategory.length > 0 && (
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {data.byCategory.slice(0, 4).map((row) => (
            <Card key={row.category} className="gap-1 p-3">
              <div className="text-muted-foreground text-xs">
                {EXPENSE_CATEGORY_LABELS[row.category]}
              </div>
              <div className="font-display text-lg font-bold tabular-nums">
                {formatSom(row.total)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="overflow-hidden py-0">
        {isPending ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : data?.items.length === 0 ? (
          <EmptyState icon="🧾" text={EXPENSE_UI.empty} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{EXPENSE_UI.date}</TableHead>
                <TableHead className="hidden w-36 sm:table-cell">{EXPENSE_UI.category}</TableHead>
                <TableHead>{EXPENSE_UI.description}</TableHead>
                <TableHead className="w-36 text-right">{EXPENSE_UI.amount}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{formatDate(item.date)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{EXPENSE_CATEGORY_LABELS[item.category]}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.description}
                    <span className="text-muted-foreground block text-xs sm:hidden">
                      {EXPENSE_CATEGORY_LABELS[item.category]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatSom(item.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={EXPENSE_UI.edit}
                      onClick={() => {
                        setEditing(item)
                        setFormOpen(true)
                      }}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={CARD_UI.delete}
                      onClick={() => setDeleting(item)}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

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
