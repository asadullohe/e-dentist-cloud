import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_UI,
  formatDate,
  formatSom,
  TABLE_UI,
  UI_TEXT,
} from '@e-dentist/shared'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import type { Expense } from '@/entities/expense'
import {
  Badge,
  Button,
  type ColumnMeta,
  DataTableColumnHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui'

interface Actions {
  onEdit: (expense: Expense) => void
  onRemove: (expense: Expense) => void
}

/// Funksiya, konstanta emas: ustun nomlari joriy tilda oʻqilishi uchun
export function expenseColumns({ onEdit, onRemove }: Actions): ColumnDef<Expense>[] {
  return [
    {
      accessorKey: 'date',
      meta: { title: EXPENSE_UI.date, className: 'w-28' } satisfies ColumnMeta,
      header: ({ column }) => <DataTableColumnHeader column={column} title={EXPENSE_UI.date} />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.date)}</span>
      ),
    },
    {
      accessorKey: 'category',
      meta: {
        title: EXPENSE_UI.category,
        className: 'hidden w-44 sm:table-cell',
        filter: {
          type: 'select',
          options: Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
        },
      } satisfies ColumnMeta,
      header: EXPENSE_UI.category,
      enableSorting: false,
      filterFn: 'equalsString',
      cell: ({ row }) => (
        <Badge variant="secondary">{EXPENSE_CATEGORY_LABELS[row.original.category]}</Badge>
      ),
    },
    {
      accessorKey: 'description',
      meta: { title: EXPENSE_UI.description, filter: { type: 'text' } } satisfies ColumnMeta,
      header: EXPENSE_UI.description,
      filterFn: 'includesString',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.description}
          <span className="text-muted-foreground block text-xs sm:hidden">
            {EXPENSE_CATEGORY_LABELS[row.original.category]}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      meta: { title: EXPENSE_UI.amount, className: 'w-40 text-right' } satisfies ColumnMeta,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={EXPENSE_UI.amount} className="justify-end" />
      ),
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">{formatSom(row.original.amount)}</span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      meta: { title: TABLE_UI.actions, className: 'w-12' } satisfies ColumnMeta,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 data-[state=open]:bg-muted"
                aria-label={TABLE_UI.actions}
              >
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <PencilIcon />
                {UI_TEXT.edit}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onRemove(row.original)}>
                <Trash2Icon />
                {UI_TEXT.remove}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]
}
