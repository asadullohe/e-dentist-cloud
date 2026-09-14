import { DEBTORS_UI, formatSom } from '@e-dentist/shared'
import {
  getCoreRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type DebtorSort, useDebtors } from '@/entities/debtor'
import { DataTable, DataTablePagination, DataTableViewOptions } from '@/shared/ui'
import { debtorColumns } from './columns'

export function Debtors() {
  const navigate = useNavigate()
  // Roʻyxat serverda hisoblanadi va sahifalanadi — holat mijozda,
  // sahifa va saralash soʻrovga ketadi
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [sorting, setSorting] = useState<SortingState>([{ id: 'debt', desc: true }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const sort = sorting[0]
  const { data, isPending } = useDebtors({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sort: (sort?.id as DebtorSort | undefined) ?? 'debt',
    dir: sort?.desc === false ? 'asc' : 'desc',
  })

  const table = useReactTable({
    data: data?.items ?? [],
    columns: debtorColumns(),
    pageCount: data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : -1,
    state: { pagination, sorting, columnVisibility },
    manualPagination: true,
    manualSorting: true,
    onPaginationChange: setPagination,
    onSortingChange: (updater) => {
      setSorting(updater)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{DEBTORS_UI.title}</h1>
          {data && data.total > 0 && (
            <p className="text-muted-foreground text-sm">
              {DEBTORS_UI.count(data.total)} ·{' '}
              <span className="text-destructive font-semibold">
                {DEBTORS_UI.total}: {formatSom(data.totalDebt)}
              </span>
            </p>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>

      <DataTable
        table={table}
        loading={isPending && !data}
        refreshing={isPending}
        emptyText={DEBTORS_UI.empty}
        onRowClick={(debtor) => navigate(`/patients/${debtor.patientId}/tolovlar`)}
      />

      <div className="mt-3">
        <DataTablePagination table={table} />
      </div>
    </>
  )
}
