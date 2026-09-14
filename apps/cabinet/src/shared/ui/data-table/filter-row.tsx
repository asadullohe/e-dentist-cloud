import { TABLE_UI } from '@e-dentist/shared'
import type { Column, Table as TableInstance } from '@tanstack/react-table'
import { XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../button'
import { Input } from '../input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select'
import { TableHead, TableRow } from '../table'
import type { FacetOption } from './faceted-filter'

/// thead dagi filtr turlari — ustun `meta.filter` da belgilanadi
export type ColumnFilterMeta =
  | { type: 'text'; placeholder?: string }
  | { type: 'select'; options: readonly FacetOption[] }

/// Roʻyxatda «hammasi» qiymati: Radix Select boʻsh satrni qabul qilmaydi
const ALL = '__all__'

/// Yozish tugaguncha kutadi: server sahifalaydigan jadvallarda har harfga
/// soʻrov ketmasin. Mijoz tomonidagi jadvallar uchun ham zarari yoʻq
function TextFilter<TData>({
  column,
  placeholder,
}: {
  column: Column<TData>
  placeholder?: string
}) {
  const current = (column.getFilterValue() as string | undefined) ?? ''
  const [value, setValue] = useState(current)

  useEffect(() => {
    if (value === current) return
    const timer = setTimeout(() => column.setFilterValue(value || undefined), 300)
    return () => clearTimeout(timer)
  }, [value, current, column])

  // Tashqaridan tozalansa (masalan «Tozalash» tugmasi) maydon ham boʻshasin
  useEffect(() => {
    if (current === '') setValue('')
  }, [current])

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder ?? TABLE_UI.filter_search}
        aria-label={placeholder ?? TABLE_UI.filter_search}
        className="h-8 pr-7 text-xs font-normal"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={TABLE_UI.filter_clear}
          className="text-muted-foreground absolute top-1/2 right-0.5 size-7 -translate-y-1/2"
          onClick={() => setValue('')}
        >
          <XIcon className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

function SelectFilter<TData>({
  column,
  options,
}: {
  column: Column<TData>
  options: readonly FacetOption[]
}) {
  const current = (column.getFilterValue() as string | undefined) ?? ALL
  return (
    <Select
      value={current}
      onValueChange={(next) => column.setFilterValue(next === ALL ? undefined : next)}
    >
      <SelectTrigger
        size="sm"
        className="h-8 w-full text-xs font-normal"
        aria-label={TABLE_UI.filter_search}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{TABLE_UI.filter_all}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/// Sarlavha ostidagi filtr qatori: filtri bor ustunda maydon, qolganida boʻsh
/// katak. Birorta ustunda filtr boʻlmasa qator umuman chizilmaydi
export function DataTableFilterRow<TData>({ table }: { table: TableInstance<TData> }) {
  const columns = table.getVisibleLeafColumns()
  const hasFilters = columns.some((column) => filterMeta(column) !== undefined)
  if (!hasFilters) return null

  return (
    <TableRow className="hover:bg-transparent">
      {columns.map((column) => {
        const meta = filterMeta(column)
        const className = (column.columnDef.meta as { className?: string } | undefined)?.className
        return (
          <TableHead key={column.id} className={className}>
            {meta?.type === 'text' && <TextFilter column={column} placeholder={meta.placeholder} />}
            {meta?.type === 'select' && <SelectFilter column={column} options={meta.options} />}
          </TableHead>
        )
      })}
    </TableRow>
  )
}

function filterMeta<TData>(column: Column<TData>): ColumnFilterMeta | undefined {
  return (column.columnDef.meta as { filter?: ColumnFilterMeta } | undefined)?.filter
}
