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
  /// `visits.write` boʻlmasa amallar ustuni chiqmaydi — server baribir rad
  /// etadi, lekin tugma koʻrinib turishi chalgʻitadi
  canEdit: boolean
}

/// Funksiya, konstanta emas: ustun nomlari joriy tilda oʻqilishi uchun
export function visitColumns({ onEdit, onRemove, canEdit }: Actions): ColumnDef<Visit>[] {
  const columns: ColumnDef<Visit>[] = [
    {
      accessorKey: 'date',
      meta: { title: CARD_UI.date, className: 'hidden w-28 sm:table-cell' } satisfies ColumnMeta,
      header: ({ column }) => <DataTableColumnHeader column={column} title={CARD_UI.date} />,
      cell: ({ row }) => (
        <span className="tabular-nums">{formatDate(row.original.date.slice(0, 10))}</span>
      ),
    },
    {
      accessorKey: 'treatment',
      meta: {
        title: CARD_UI.treatment,
        className: 'whitespace-normal',
        filter: { type: 'text' },
      } satisfies ColumnMeta,
      header: CARD_UI.treatment,
      enableSorting: false,
      filterFn: 'includesString',
      enableHiding: false,
      // Tor ekranda sana va tish ustunlari yashirin — shu yerda qator ostida
      cell: ({ row }) => {
        const visit = row.original
        return (
          <div>
            {visit.treatment}
            <div className="text-muted-foreground text-xs tabular-nums sm:hidden">
              {formatDate(visit.date.slice(0, 10))}
              {visit.tooth !== null && ` · ${CARD_UI.tooth} ${visit.tooth}`}
            </div>
            {visit.note && <div className="text-muted-foreground text-xs">{visit.note}</div>}
          </div>
        )
      },
    },
    {
      accessorKey: 'doctorName',
      meta: { title: CARD_UI.doctor, className: 'hidden w-40 md:table-cell' } satisfies ColumnMeta,
      header: CARD_UI.doctor,
      enableSorting: false,
      cell: ({ row }) => (
        <span className={row.original.doctorName ? '' : 'text-muted-foreground'}>
          {row.original.doctorName ?? CARD_UI.doctor_unknown}
        </span>
      ),
    },
    {
      accessorKey: 'tooth',
      meta: { title: CARD_UI.tooth, className: 'hidden w-20 sm:table-cell' } satisfies ColumnMeta,
      header: CARD_UI.tooth,
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{row.original.tooth ?? '—'}</span>,
    },
    {
      accessorKey: 'price',
      meta: { title: CARD_UI.price, className: 'text-right sm:w-36' } satisfies ColumnMeta,
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
  return canEdit ? columns : columns.filter((column) => column.id !== 'actions')
}
