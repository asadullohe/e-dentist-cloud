import { formatMoney, PAYROLL_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { ChevronRightIcon } from 'lucide-react'
import type { PayrollRow } from '@/entities/payroll'

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

/// Roʻyxatdagi xodim: ism, rol · foiz · ishlar, olingan/olinmagan chizigʻi
/// (foizdagilarda), jami va qoldiq. Bosilsa varaq ochiladi
export function StaffRow({ row, onOpen }: { row: PayrollRow; onOpen: () => void }) {
  const byPercent = row.percent > 0
  const meta = [
    row.roleName,
    byPercent ? `${row.percent} %` : null,
    row.visits > 0 ? PAYROLL_UI.works_count(row.visits) : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const collectedPct = row.charges > 0 ? (row.collected / row.charges) * 100 : 0

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'hover:bg-accent/60 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
        row.status === 'disabled' && 'opacity-60',
      )}
    >
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {initialsOf(row.fullName)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{row.fullName}</span>
        <span className="text-muted-foreground block truncate text-xs">{meta}</span>
        {byPercent && row.charges > 0 && (
          <span className="bg-destructive/60 mt-1.5 flex h-1.5 w-36 overflow-hidden rounded-full">
            <span className="bg-ok h-full" style={{ width: `${collectedPct}%` }} />
          </span>
        )}
      </span>
      <span className="text-right">
        <span className="block font-bold tabular-nums">{formatMoney(String(row.total))}</span>
        <span
          className={cn(
            'block text-xs',
            row.remaining > 0 ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {row.remaining > 0
            ? `${PAYROLL_UI.remaining_short} ${formatMoney(String(row.remaining))}`
            : row.total > 0
              ? PAYROLL_UI.paid_up
              : '—'}
        </span>
      </span>
      <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    </button>
  )
}
