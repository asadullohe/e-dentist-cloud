import { TABLE_UI } from '@e-dentist/shared'
import type { Table } from '@tanstack/react-table'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'
import { Button } from '../button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select'

const PAGE_SIZES = [10, 20, 30, 50]

/// Sahifa raqamlari: birinchi, oxirgi, joriy atrofidagilar; oraliqlar «…»
export function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  // Chetlarda ham kamida toʻrtta raqam koʻrinsin: 1 2 3 4 … 20
  if (current <= 3) for (const n of [2, 3, 4]) pages.add(n)
  if (current >= total - 2) for (const n of [total - 3, total - 2, total - 1]) pages.add(n)

  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  for (const [i, n] of sorted.entries()) {
    const prev = sorted[i - 1]
    if (prev !== undefined && n - prev > 1) out.push('…')
    out.push(n)
  }
  return out
}

/// Sahifalash paneli: sahifada nechta qator, joriy sahifa, oʻtish tugmalari
export function DataTablePagination<TData>({ table }: { table: Table<TData> }) {
  const page = table.getState().pagination.pageIndex + 1
  const total = Math.max(1, table.getPageCount())

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-4 px-2 sm:flex-row">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{TABLE_UI.rows_per_page}</p>
        <Select
          value={String(table.getState().pagination.pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger className="h-8 w-18">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="text-sm font-medium">{TABLE_UI.page_of(page, total)}</div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="hidden size-8 p-0 md:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label={TABLE_UI.first_page}
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={TABLE_UI.prev_page}
          >
            <ChevronLeftIcon />
          </Button>

          {pageNumbers(page, total).map((n, i) =>
            n === '…' ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: «…» belgilarining oʻzi bir xil, oʻrni farqlaydi
              <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={n}
                variant={n === page ? 'default' : 'outline'}
                className="h-8 min-w-8 px-2"
                onClick={() => table.setPageIndex(n - 1)}
              >
                {n}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={TABLE_UI.next_page}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 p-0 md:flex"
            onClick={() => table.setPageIndex(total - 1)}
            disabled={!table.getCanNextPage()}
            aria-label={TABLE_UI.last_page}
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
