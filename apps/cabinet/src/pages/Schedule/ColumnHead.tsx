import { MONTHS_SHORT, WEEKDAYS } from '@e-dentist/shared'
import { cn } from 'cn'
import { initialsOf } from '@/shared/lib'
import { mondayFirst, parseIso } from './scheduleUtils'

/// Shifokor ustunining sarlavhasi; `id: null` — «Shifokorsiz» ustuni
export interface DoctorHead {
  id: string | null
  name: string
  /// Shu kundagi qabullar soni
  count: number
}

export function DoctorHeadCell({ doctor }: { doctor: DoctorHead }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
        {doctor.id === null ? '—' : initialsOf(doctor.name)}
      </span>
      <span className="truncate text-xs font-medium">{doctor.name}</span>
      <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">{doctor.count}</span>
    </div>
  )
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
