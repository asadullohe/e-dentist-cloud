import { EXPENSE_UI, formatMonth, shiftMonth, todayISO } from '@e-dentist/shared'
import { cn } from 'cn'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from './button'

const thisMonth = () => todayISO().slice(0, 7)

/// Oy almashtirgich: ‹ Sentabr 2026 › va joriy oyga qaytish. Xarajatlar,
/// hisobotlar va ish haqi bir xil boshqaruvni ishlatadi. Telefonda butun
/// qatorni egallaydi — oy nomi oʻrtada, tugmalar chetda
export function MonthNav({
  month,
  onChange,
  className,
}: {
  month: string
  onChange: (month: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex w-full items-center gap-1 sm:w-auto', className)}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={EXPENSE_UI.prev_month}
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeftIcon />
      </Button>
      <span className="flex-1 text-center font-semibold sm:min-w-36 sm:flex-none">
        {formatMonth(month)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={EXPENSE_UI.next_month}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRightIcon />
      </Button>
      {month !== thisMonth() && (
        <Button variant="outline" size="sm" onClick={() => onChange(thisMonth())}>
          {EXPENSE_UI.this_month}
        </Button>
      )}
    </div>
  )
}
