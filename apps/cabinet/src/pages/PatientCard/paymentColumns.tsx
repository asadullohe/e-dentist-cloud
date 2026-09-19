import { formatDate, formatSom, PAYMENT_UI, TABLE_UI } from '@e-dentist/shared'
import type { ColumnDef } from '@tanstack/react-table'
import { cn } from 'cn'
import { BanIcon, MoreHorizontalIcon, PencilIcon } from 'lucide-react'
import type { Payment } from '@/entities/payment'
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
  onEdit: (payment: Payment) => void
  onCancel: (payment: Payment) => void
  /// `payments.write` boʻlmasa amallar ustuni chiqmaydi — server baribir rad
  /// etadi, lekin tugma koʻrinib turishi chalgʻitadi
  canEdit: boolean
}

/// Bekor qilingan toʻlov roʻyxatda qoladi: summasi chizilgan, yonida sabab,
/// kim va qachon bekor qilgani. Hisobga kirmaydi (server) — shuning uchun
/// koʻrinishi ham «yoʻq» ga yaqin
const cancelled = (payment: Payment) => payment.cancelledAt !== null

/// Funksiya, konstanta emas: ustun nomlari joriy tilda oʻqilishi uchun
export function paymentColumns({ onEdit, onCancel, canEdit }: Actions): ColumnDef<Payment>[] {
  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: 'date',
      meta: { title: PAYMENT_UI.date, className: 'w-28' } satisfies ColumnMeta,
      header: ({ column }) => <DataTableColumnHeader column={column} title={PAYMENT_UI.date} />,
      cell: ({ row }) => (
        <span className={cn('tabular-nums', cancelled(row.original) && 'text-muted-foreground')}>
          {formatDate(row.original.date.slice(0, 10))}
        </span>
      ),
    },
    {
      accessorKey: 'note',
      meta: { title: PAYMENT_UI.note, filter: { type: 'text' } } satisfies ColumnMeta,
      header: PAYMENT_UI.note,
      enableSorting: false,
      filterFn: 'includesString',
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original
        return (
          <div className="space-y-1">
            <div className="text-muted-foreground">{payment.note ?? '—'}</div>
            {payment.createdByName && (
              <div className="text-muted-foreground text-xs">
                {PAYMENT_UI.received_by}: {payment.createdByName}
              </div>
            )}
            {cancelled(payment) && (
              <div className="text-destructive text-xs">
                <Badge variant="outline" className="border-destructive/40 mr-1.5 text-[11px]">
                  {PAYMENT_UI.cancelled}
                </Badge>
                {payment.cancelReason} ·{' '}
                {PAYMENT_UI.cancelled_by(
                  payment.cancelledByName ?? '',
                  formatDate((payment.cancelledAt ?? '').slice(0, 10)),
                )}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'amount',
      meta: { title: PAYMENT_UI.amount, className: 'w-36 text-right' } satisfies ColumnMeta,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={PAYMENT_UI.amount} className="justify-end" />
      ),
      cell: ({ row }) => (
        <span
          className={cn(
            'font-medium tabular-nums',
            cancelled(row.original) && 'text-muted-foreground line-through',
          )}
        >
          {formatSom(row.original.amount)}
        </span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      meta: { title: TABLE_UI.actions, className: 'w-12' } satisfies ColumnMeta,
      cell: ({ row }) =>
        cancelled(row.original) ? null : (
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
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  <PencilIcon />
                  {PAYMENT_UI.edit_note}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => onCancel(row.original)}>
                  <BanIcon />
                  {PAYMENT_UI.cancel}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
    },
  ]
  return canEdit ? columns : columns.filter((column) => column.id !== 'actions')
}
