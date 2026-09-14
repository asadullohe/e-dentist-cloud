import { formatSom, SERVICE_UI, TABLE_UI, UI_TEXT } from '@e-dentist/shared'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import type { Service } from '@/entities/service'
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
  onEdit: (service: Service) => void
  onRemove: (service: Service) => void
}

/// Funksiya, konstanta emas: ustun nomlari joriy tilda oʻqilishi uchun
export function serviceColumns({ onEdit, onRemove }: Actions): ColumnDef<Service>[] {
  return [
    {
      accessorKey: 'name',
      meta: {
        title: SERVICE_UI.name,
        filter: { type: 'text', placeholder: SERVICE_UI.search },
      } satisfies ColumnMeta,
      header: ({ column }) => <DataTableColumnHeader column={column} title={SERVICE_UI.name} />,
      enableHiding: false,
      filterFn: 'includesString',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'price',
      meta: { title: SERVICE_UI.price, className: 'w-44 text-right' } satisfies ColumnMeta,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={SERVICE_UI.price} className="justify-end" />
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
