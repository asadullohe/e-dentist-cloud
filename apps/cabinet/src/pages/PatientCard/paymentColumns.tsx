import { formatDate, formatSom, PAYMENT_UI, TABLE_UI, UI_TEXT } from '@e-dentist/shared'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import type { Payment } from '@/entities/payment'
import {
  Button,
  type ColumnMeta,
  DataTableColumnHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui'

interface Actions {
  onEdit: (payment: Payment) => void
  onRemove: (payment: Payment) => void
  /// `payments.write` boʻlmasa amallar ustuni chiqmaydi — server baribir rad
  /// etadi, lekin tugma koʻrinib turishi chalgʻitadi
  canEdit: boolean
}

/// Funksiya, konstanta emas: ustun nomlari joriy tilda oʻqilishi uchun
export function paymentColumns({ onEdit, onRemove, canEdit }: Actions): ColumnDef<Payment>[] {
  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: 'date',
      meta: { title: PAYMENT_UI.date, className: 'w-28' } satisfies ColumnMeta,
      header: ({ column }) => <DataTableColumnHeader column={column} title={PAYMENT_UI.date} />,
      cell: ({ row }) => (
        <span className="tabular-nums">{formatDate(row.original.date.slice(0, 10))}</span>
      ),
    },
    {
      accessorKey: 'note',
      meta: { title: PAYMENT_UI.note, filter: { type: 'text' } } satisfies ColumnMeta,
      header: PAYMENT_UI.note,
      enableSorting: false,
      filterFn: 'includesString',
      enableHiding: false,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.note ?? '—'}</span>,
    },
    {
      accessorKey: 'amount',
      meta: { title: PAYMENT_UI.amount, className: 'w-36 text-right' } satisfies ColumnMeta,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={PAYMENT_UI.amount} className="justify-end" />
      ),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">{formatSom(row.original.amount)}</span>
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
  return canEdit ? columns : columns.filter((column) => column.id !== 'actions')
}
