import { flexRender, type Table as TableInstance } from '@tanstack/react-table'
import { cn } from 'cn'
import { Card } from '../card'
import { Skeleton } from '../skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table'
import { type ColumnFilterMeta, DataTableFilterRow } from './filter-row'

/// Ustun `meta`: ustunlar menyusidagi nomi, katak sinfi va thead dagi filtr
export interface ColumnMeta {
  title: string
  className?: string
  /// Berilsa sarlavha ostida filtr qatori chiqadi (matn yoki roʻyxat).
  /// Server sahifalaydigan jadvalda `manualFiltering` + `columnFilters` soʻrovga ketadi
  filter?: ColumnFilterMeta
}

interface Props<TData> {
  table: TableInstance<TData>
  /// Birinchi yuklanish — skelet. Keyingi soʻrovlarda jadval xira turadi
  loading?: boolean
  refreshing?: boolean
  emptyText: string
  rowClassName?: (row: TData) => string | undefined
  /// Qator bosilganda — masalan, kartochkaga oʻtish. Qator ichidagi tugma
  /// va havolalar oʻz ishini qiladi, qatorga oʻtmaydi
  onRowClick?: (row: TData) => void
}

/// Bosilgan joy tugma, havola yoki forma elementi boʻlsa — bu qator emas,
/// oʻsha elementning oʻzi
function insideControl(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('button, a, input, select, textarea, [role="menu"]') !== null
  )
}

/// Jadvalning oʻzi: sarlavha, qatorlar, boʻsh holat. Ustunlar va holat —
/// `useReactTable` da, bu yerda faqat chizish
export function DataTable<TData>({
  table,
  loading = false,
  refreshing = false,
  emptyText,
  rowClassName,
  onRowClick,
}: Props<TData>) {
  const meta = (column: { columnDef: { meta?: unknown } }) =>
    column.columnDef.meta as ColumnMeta | undefined

  return (
    <Card className="gap-0 overflow-hidden p-0">
      {loading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={meta(header.column)?.className}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
            <DataTableFilterRow table={table} />
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(
                    onRowClick &&
                      'cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none',
                    refreshing && 'opacity-60',
                    rowClassName?.(row.original),
                  )}
                  onClick={
                    onRowClick &&
                    ((event) => {
                      if (!insideControl(event.target)) onRowClick(row.original)
                    })
                  }
                  onKeyDown={
                    onRowClick &&
                    ((event) => {
                      // Klaviatura: qator fokusda turganda Enter — bosish bilan teng
                      if (event.key === 'Enter' && event.target === event.currentTarget) {
                        onRowClick(row.original)
                      }
                    })
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={meta(cell.column)?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="text-muted-foreground h-24 text-center"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
