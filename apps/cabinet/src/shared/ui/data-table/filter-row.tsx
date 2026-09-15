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
  /// Son oraligʻi: qiymat `[dan, gacha]` — TanStack `inNumberRange` bilan mos
  | { type: 'range' }

type Range = [number | undefined, number | undefined]

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
    if (current === '') setValue((prev) => (prev === '' ? prev : ''))
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

/// Ikki kichik maydon: «dan» va «gacha». Boʻsh — chegara yoʻq
function RangeFilter<TData>({ column }: { column: Column<TData> }) {
  // Massiv emas, ikkita son: filtr boʻsh boʻlganda har renderda yangi
  // `[undefined, undefined]` chiqib effektni cheksiz aylantirib yubormasin
  const current = column.getFilterValue() as Range | undefined
  const from = current?.[0]
  const to = current?.[1]
  const [value, setValue] = useState<[string, string]>([
    from?.toString() ?? '',
    to?.toString() ?? '',
  ])

  useEffect(() => {
    const nextFrom = value[0] === '' ? undefined : Number(value[0])
    const nextTo = value[1] === '' ? undefined : Number(value[1])
    if (nextFrom === from && nextTo === to) return
    const timer = setTimeout(
      () =>
        column.setFilterValue(
          nextFrom === undefined && nextTo === undefined ? undefined : [nextFrom, nextTo],
        ),
      300,
    )
    return () => clearTimeout(timer)
  }, [value, from, to, column])

  // Tashqaridan tozalansa maydonlar ham boʻshasin
  useEffect(() => {
    if (from === undefined && to === undefined) {
      setValue((prev) => (prev[0] === '' && prev[1] === '' ? prev : ['', '']))
    }
  }, [from, to])

  const field = (index: 0 | 1, placeholder: string) => (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      value={value[index]}
      onChange={(event) => {
        const next: [string, string] = [...value]
        next[index] = event.target.value
        setValue(next)
      }}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-8 px-2 text-xs font-normal"
    />
  )

  return (
    <div className="flex items-center gap-1">
      {field(0, TABLE_UI.range_from)}
      <span className="text-muted-foreground text-xs">–</span>
      {field(1, TABLE_UI.range_to)}
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
            {meta?.type === 'range' && <RangeFilter column={column} />}
          </TableHead>
        )
      })}
    </TableRow>
  )
}

function filterMeta<TData>(column: Column<TData>): ColumnFilterMeta | undefined {
  return (column.columnDef.meta as { filter?: ColumnFilterMeta } | undefined)?.filter
}
