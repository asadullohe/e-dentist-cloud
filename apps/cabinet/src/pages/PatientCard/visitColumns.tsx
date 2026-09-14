import { CARD_UI, formatDate, formatSom, TABLE_UI, UI_TEXT } from '@e-dentist/shared'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import type { Visit } from '@/entities/visit'
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
  onEdit: (visit: Visit) => void
  onRemove: (visit: Visit) => void
}

/// Funksiya, konstanta emas: ustun nomlari joriy tilda oʻqilishi uchun
export function visitColumns({ onEdit, onRemove }: Actions): ColumnDef<Visit>[] {
  return [
    {
      accessorKey: 'date',
      meta: { title: CARD_UI.date, className: 'w-28' } satisfies ColumnMeta,
      header: ({ column }) => <DataTableColumnHeader column={column} title={CARD_UI.date} />,
      cell: ({ row }) => (
        <span className="tabular-nums">{formatDate(row.original.date.slice(0, 10))}</span>
      ),
    },
    {
      accessorKey: 'treatment',
      meta: { title: CARD_UI.treatment, filter: { type: 'text' } } satisfies ColumnMeta,
      header: CARD_UI.treatment,
      enableSorting: false,
      filterFn: 'includesString',
      enableHiding: false,
      cell: ({ row }) => (
        <div>
          {row.original.treatment}
          {row.original.note && (
            <div className="text-muted-foreground text-xs">{row.original.note}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'tooth',
      meta: { title: CARD_UI.tooth, className: 'w-20' } satisfies ColumnMeta,
      header: CARD_UI.tooth,
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{row.original.tooth ?? '—'}</span>,
    },
    {
      accessorKey: 'price',
      meta: { title: CARD_UI.price, className: 'w-36 text-right' } satisfies ColumnMeta,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={CARD_UI.price} className="justify-end" />
      ),
      cell: ({ row }) => <span className="tabular-nums">{formatSom(row.original.price)}</span>,
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
