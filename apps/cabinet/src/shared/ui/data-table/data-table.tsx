import { flexRender, type Table as TableInstance } from '@tanstack/react-table'
import { cn } from 'cn'
import { Card } from '../card'
import { Skeleton } from '../skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table'

/// Ustun `meta`: ustunlar menyusidagi nomi va tor ekranda yashirish sinfi
export interface ColumnMeta {
  title: string
  className?: string
}

interface Props<TData> {
  table: TableInstance<TData>
  /// Birinchi yuklanish — skelet. Keyingi soʻrovlarda jadval xira turadi
  loading?: boolean
  refreshing?: boolean
  emptyText: string
  rowClassName?: (row: TData) => string | undefined
}

/// Jadvalning oʻzi: sarlavha, qatorlar, boʻsh holat. Ustunlar va holat —
/// `useReactTable` da, bu yerda faqat chizish
export function DataTable<TData>({
  table,
  loading = false,
  refreshing = false,
  emptyText,
  rowClassName,
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
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(refreshing && 'opacity-60', rowClassName?.(row.original))}
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
