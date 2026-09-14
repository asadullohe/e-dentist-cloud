import { DEBTORS_UI, formatSom, formatUzPhone, PAYMENT_UI } from '@e-dentist/shared'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import type { Debtor } from '@/entities/debtor'
import { type ColumnMeta, DataTableColumnHeader } from '@/shared/ui'

/// Funksiya, konstanta emas: ustun nomlari joriy tilda oʻqilishi uchun
export function debtorColumns(): ColumnDef<Debtor>[] {
  return [
    {
      accessorKey: 'fio',
      meta: { title: DEBTORS_UI.patient } satisfies ColumnMeta,
      header: DEBTORS_UI.patient,
      // Ism serverda sahifalashdan keyin olinadi — u boʻyicha saralab boʻlmaydi
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="font-medium">
          <Link
            to={`/patients/${row.original.patientId}/tolovlar`}
            className="hover:text-primary hover:underline"
          >
            {row.original.fio}
          </Link>
          {row.original.phone && (
            <span className="text-muted-foreground block text-xs sm:hidden">
              {formatUzPhone(row.original.phone)}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      meta: {
        title: DEBTORS_UI.phone,
        className: 'hidden w-44 sm:table-cell',
      } satisfies ColumnMeta,
      header: DEBTORS_UI.phone,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.phone ? formatUzPhone(row.original.phone) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'charges',
      meta: {
        title: PAYMENT_UI.charges,
        className: 'hidden w-36 text-right lg:table-cell',
      } satisfies ColumnMeta,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={PAYMENT_UI.charges} className="justify-end" />
      ),
      cell: ({ row }) => <span className="tabular-nums">{formatSom(row.original.charges)}</span>,
    },
    {
      accessorKey: 'paid',
      meta: {
        title: PAYMENT_UI.paid,
        className: 'hidden w-36 text-right lg:table-cell',
      } satisfies ColumnMeta,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={PAYMENT_UI.paid} className="justify-end" />
      ),
      cell: ({ row }) => <span className="tabular-nums">{formatSom(row.original.paid)}</span>,
    },
    {
      accessorKey: 'debt',
      meta: { title: PAYMENT_UI.debt, className: 'w-36 text-right' } satisfies ColumnMeta,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={PAYMENT_UI.debt} className="justify-end" />
      ),
      enableHiding: false,
      cell: ({ row }) => (
        <span className="text-destructive font-semibold tabular-nums">
          {formatSom(row.original.debt)}
        </span>
      ),
    },
  ]
}
