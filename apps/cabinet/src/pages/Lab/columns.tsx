import {
  formatDate,
  formatSom,
  LAB_MATERIAL_LABELS,
  LAB_RETURN_REASON_LABELS,
  LAB_STATUS_LABELS,
  LAB_UI,
  LAB_WORK_TYPE_LABELS,
  TABLE_UI,
  UI_TEXT,
} from '@e-dentist/shared'
import type { ColumnDef } from '@tanstack/react-table'
import { cn } from 'cn'
import {
  CheckIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
  TruckIcon,
} from 'lucide-react'
import type { LabOrder } from '@/entities/lab-order'
import {
  Badge,
  Button,
  type ColumnMeta,
  DataTableColumnHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type FacetOption,
} from '@/shared/ui'

interface Actions {
  /// Tahrirlash, oʻchirish, topshirish va qaytarish — faqat `lab.write`.
  /// Texnik (`lab.own`) oʻz naryadini faqat «tayyor» qila oladi
  canWrite: boolean
  canSeePrice: boolean
  onReady: (order: LabOrder) => void
  onDelivered: (order: LabOrder) => void
  onReturn: (order: LabOrder) => void
  onEdit: (order: LabOrder) => void
  onRemove: (order: LabOrder) => void
  /// thead filtri uchun texniklar roʻyxati (faqat `lab.write` da bor)
  techOptions: readonly FacetOption[]
}

/// Funksiya, konstanta emas: ustun nomlari joriy tilda oʻqilishi uchun
export function labColumns(a: Actions): ColumnDef<LabOrder>[] {
  const columns: ColumnDef<LabOrder>[] = [
    {
      accessorKey: 'fio',
      meta: {
        title: LAB_UI.patient,
        className: 'whitespace-normal',
        filter: { type: 'text' },
      } satisfies ColumnMeta,
      header: ({ column }) => <DataTableColumnHeader column={column} title={LAB_UI.patient} />,
      enableHiding: false,
      filterFn: 'includesString',
      // Tor ekranda ish turi va muddat ustunlari yashirin — shu yerda qator ostida
      cell: ({ row }) => {
        const o = row.original
        return (
          <div className="min-w-0">
            <div className="font-medium">{o.fio}</div>
            <div className="text-muted-foreground text-xs sm:hidden">
              {LAB_WORK_TYPE_LABELS[o.workType]} · {LAB_MATERIAL_LABELS[o.material]}
            </div>
            <div
              className={cn(
                'text-muted-foreground text-xs tabular-nums md:hidden',
                o.overdue && 'text-destructive font-medium',
              )}
            >
              {LAB_UI.due}: {formatDate(o.dueDate)}
            </div>
          </div>
        )
      },
    },
    {
      id: 'work',
      accessorFn: (order) => order.workType,
      meta: {
        title: LAB_UI.work_type,
        className: 'hidden sm:table-cell',
        filter: {
          type: 'select',
          options: Object.entries(LAB_WORK_TYPE_LABELS).map(([value, label]) => ({ value, label })),
        },
      } satisfies ColumnMeta,
      header: LAB_UI.work_type,
      enableSorting: false,
      filterFn: 'equalsString',
      cell: ({ row }) => {
        const o = row.original
        return (
          <div className="min-w-0">
            <div>
              {LAB_WORK_TYPE_LABELS[o.workType]} · {LAB_MATERIAL_LABELS[o.material]}
              {o.shade ? ` · ${o.shade}` : ''}
            </div>
            {o.note && <div className="text-muted-foreground truncate text-xs">{o.note}</div>}
          </div>
        )
      },
    },
    {
      id: 'teeth',
      accessorFn: (order) => order.teeth.join(', '),
      meta: { title: LAB_UI.teeth, className: 'hidden md:table-cell' } satisfies ColumnMeta,
      header: LAB_UI.teeth,
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{row.original.teeth.join(', ')}</span>,
    },
    {
      id: 'tech',
      accessorFn: (order) => order.techId ?? '',
      meta: {
        title: LAB_UI.tech,
        className: 'hidden lg:table-cell',
        filter: a.techOptions.length ? { type: 'select', options: a.techOptions } : undefined,
      } satisfies ColumnMeta,
      header: LAB_UI.tech,
      enableSorting: false,
      filterFn: 'equalsString',
      cell: ({ row }) =>
        row.original.techName ?? <span className="text-muted-foreground">{LAB_UI.tech_none}</span>,
    },
    {
      accessorKey: 'dueDate',
      meta: { title: LAB_UI.due, className: 'hidden w-28 md:table-cell' } satisfies ColumnMeta,
      header: ({ column }) => <DataTableColumnHeader column={column} title={LAB_UI.due} />,
      cell: ({ row }) => (
        <span
          className={cn('tabular-nums', row.original.overdue && 'text-destructive font-medium')}
        >
          {formatDate(row.original.dueDate)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      meta: {
        title: LAB_UI.status,
        filter: {
          type: 'select',
          options: Object.entries(LAB_STATUS_LABELS).map(([value, label]) => ({ value, label })),
        },
      } satisfies ColumnMeta,
      header: LAB_UI.status,
      enableSorting: false,
      filterFn: 'equalsString',
      cell: ({ row }) => {
        const o = row.original
        return (
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="secondary">{LAB_STATUS_LABELS[o.status]}</Badge>
            {o.overdue && <Badge variant="destructive">{LAB_UI.overdue}</Badge>}
            {o.returns > 0 && <Badge variant="outline">{LAB_UI.returns(o.returns)}</Badge>}
            {o.returnReason && (
              <span className="text-muted-foreground w-full text-xs">
                {LAB_UI.returned_at}: {LAB_RETURN_REASON_LABELS[o.returnReason]}
                {o.returnNote ? ` — ${o.returnNote}` : ''}
              </span>
            )}
          </div>
        )
      },
    },
  ]

  if (a.canSeePrice) {
    columns.push({
      accessorKey: 'techPrice',
      meta: {
        title: LAB_UI.tech_price,
        className: 'hidden w-36 text-right xl:table-cell',
      } satisfies ColumnMeta,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={LAB_UI.tech_price} className="justify-end" />
      ),
      cell: ({ row }) =>
        row.original.techPrice === undefined ? (
          '—'
        ) : (
          <span className="tabular-nums">{formatSom(row.original.techPrice)}</span>
        ),
    })
  }

  columns.push({
    id: 'actions',
    enableHiding: false,
    enableSorting: false,
    meta: { title: TABLE_UI.actions, className: 'w-12' } satisfies ColumnMeta,
    cell: ({ row }) => {
      const o = row.original
      const canReady = o.status === 'issued'
      const canDeliver = o.status === 'ready' && a.canWrite
      return (
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
              {canReady && (
                <DropdownMenuItem onClick={() => a.onReady(o)}>
                  <CheckIcon />
                  {LAB_UI.mark_ready}
                </DropdownMenuItem>
              )}
              {canDeliver && (
                <>
                  <DropdownMenuItem onClick={() => a.onDelivered(o)}>
                    <TruckIcon />
                    {LAB_UI.mark_delivered}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => a.onReturn(o)}>
                    <RotateCcwIcon />
                    {LAB_UI.mark_returned}
                  </DropdownMenuItem>
                </>
              )}
              {a.canWrite && (
                <>
                  {(canReady || canDeliver) && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={() => a.onEdit(o)}>
                    <PencilIcon />
                    {UI_TEXT.edit}
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => a.onRemove(o)}>
                    <Trash2Icon />
                    {UI_TEXT.remove}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  })

  return columns
}
