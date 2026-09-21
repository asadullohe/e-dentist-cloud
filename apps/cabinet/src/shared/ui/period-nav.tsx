import {
  currentPeriodLabel,
  formatPeriod,
  PERIOD_KINDS,
  PERIOD_UI,
  type Period,
  type PeriodKind,
  samePeriod,
  shiftPeriod,
  todayISO,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from './button'

/// Davr tanlovi: Kun · Hafta · Oy · Yil, ‹ sarlavha › va joriy davrga
/// qaytish. Xarajatlar va hisobotlar bir xil boshqaruvni ishlatadi.
/// Telefonda ikki qator: tur tanlovi butun kenglikda, ostida almashtirgich
export function PeriodNav({
  value,
  onChange,
  className,
}: {
  value: Period
  onChange: (period: Period) => void
  className?: string
}) {
  const current: Period = { kind: value.kind, anchor: todayISO() }
  const isCurrent = samePeriod(value, current)

  function setKind(kind: PeriodKind) {
    // Tur almashganda sana qoladi: 15-sentabr «kun» → shu hafta → sentabr → 2026
    onChange({ kind, anchor: value.anchor })
  }

  return (
    <div className={cn('flex w-full flex-wrap items-center gap-2 sm:w-auto', className)}>
      <div className="bg-muted flex w-full rounded-md p-0.5 sm:w-auto">
        {PERIOD_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={value.kind === kind}
            onClick={() => setKind(kind)}
            className={cn(
              'flex-1 rounded px-3 py-1.5 text-sm transition-colors sm:flex-none',
              value.kind === kind
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {PERIOD_UI.kinds[kind]}
          </button>
        ))}
      </div>

      <div className="flex w-full items-center gap-1 sm:w-auto">
        <Button
          variant="ghost"
          size="icon"
          aria-label={PERIOD_UI.prev}
          onClick={() => onChange(shiftPeriod(value, -1))}
        >
          <ChevronLeftIcon />
        </Button>
        <span className="flex-1 text-center font-semibold whitespace-nowrap tabular-nums sm:min-w-40 sm:flex-none">
          {formatPeriod(value)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={PERIOD_UI.next}
          onClick={() => onChange(shiftPeriod(value, 1))}
        >
          <ChevronRightIcon />
        </Button>
        {!isCurrent && (
          <Button variant="outline" size="sm" onClick={() => onChange(current)}>
            {currentPeriodLabel(value.kind)}
          </Button>
        )}
      </div>
    </div>
  )
}
