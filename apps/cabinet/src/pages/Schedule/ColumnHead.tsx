import { MONTHS_SHORT, WEEKDAYS } from '@e-dentist/shared'
import { cn } from 'cn'
import { mondayFirst, parseIso } from './scheduleUtils'

/// Shifokor ustunining sarlavhasi; `id: null` — «Shifokorsiz» ustuni
export interface DoctorHead {
  id: string | null
  name: string
  /// Rol nomi — kartada koʻrsatiladi (14.6)
  role: string | null
  /// Shu kundagi qabullar soni
  count: number
}

/// Hafta koʻrinishidagi kun sarlavhasi: «Se 22». Bosilsa oʻsha kunga oʻtadi
export function DayHeadCell({
  day,
  today,
  onPick,
}: {
  day: string
  today: string
  onPick: () => void
}) {
  const date = parseIso(day)
  const isToday = day === today
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-center justify-center gap-1"
    >
      <span
        className={cn(
          'text-[11px]',
          isToday ? 'text-primary font-medium' : 'text-muted-foreground',
        )}
      >
        {WEEKDAYS[mondayFirst(date)]}
      </span>
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
          isToday && 'bg-primary text-primary-foreground',
        )}
      >
        {date.getDate()}
      </span>
      {date.getDate() === 1 && (
        <span className="text-muted-foreground text-[10px]">{MONTHS_SHORT[date.getMonth()]}</span>
      )}
    </button>
  )
}
