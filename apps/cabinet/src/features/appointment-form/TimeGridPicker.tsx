import { SCHEDULE_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { type BusyRange, minutesOf, overlaps, timeOfMinutes, WORK_END, WORK_START } from './slots'

const STEP = 15
const HOURS = Array.from({ length: WORK_END - WORK_START }, (_, i) => WORK_START + i)
const QUARTERS = [0, 15, 30, 45]

/// «Kino oʻrindigʻi»: soat × chorak toʻri. Band kataklar shtrixli, ichida kim
/// borligi; tanlangan qabul — koʻk chiziq (boshlanish + davomiylik), band
/// bilan kesishgan kataklari qizil. Boʻsh katak bosilsa — boshlanish vaqti
export function TimeGridPicker({
  busy,
  time,
  duration,
  onPick,
}: {
  busy: readonly BusyRange[]
  time: string
  duration: number
  onPick: (time: string) => void
}) {
  const start = /^\d\d:\d\d$/.test(time) ? minutesOf(time) : null
  const end = start === null ? null : start + duration
  const selected = (from: number) =>
    start !== null && end !== null && from < end && from + STEP > start

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[2.25rem_repeat(4,minmax(0,1fr))] border-t first:border-t-0"
          >
            <div className="bg-muted text-muted-foreground flex items-center justify-center text-[11px] tabular-nums">
              {String(hour).padStart(2, '0')}
            </div>
            {QUARTERS.map((quarter) => {
              const from = hour * 60 + quarter
              const label = timeOfMinutes(from)
              const taken = busy.find((r) => overlaps(r, from, from + STEP))
              const isSelected = selected(from)
              const isFirst = isSelected && start !== null && from <= start
              const isLast = isSelected && end !== null && from + STEP >= end
              return (
                <button
                  key={quarter}
                  type="button"
                  disabled={Boolean(taken) && !isSelected}
                  aria-pressed={isSelected}
                  aria-label={taken ? `${label} — ${taken.label}` : label}
                  onClick={() => onPick(label)}
                  className={cn(
                    'h-9 min-w-0 truncate border-l px-1 text-[11px] tabular-nums transition-colors',
                    isSelected
                      ? cn(
                          'text-primary-foreground font-semibold',
                          taken ? 'bg-destructive' : 'bg-primary',
                          isFirst && 'rounded-l-md',
                          isLast && 'rounded-r-md',
                        )
                      : taken
                        ? 'bg-muted-foreground/10 text-muted-foreground cursor-not-allowed text-[10px] [background-image:repeating-linear-gradient(135deg,transparent_0_6px,rgba(100,116,139,.12)_6px_7px)]'
                        : 'hover:bg-accent',
                  )}
                >
                  {taken && !isSelected ? taken.label : label}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="text-muted-foreground flex items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1.5">
          <i className="bg-primary size-3 rounded-sm" aria-hidden="true" />
          {SCHEDULE_UI.legend_new}
        </span>
        <span className="flex items-center gap-1.5">
          <i
            className="bg-muted-foreground/15 size-3 rounded-sm [background-image:repeating-linear-gradient(135deg,transparent_0_3px,rgba(100,116,139,.3)_3px_4px)]"
            aria-hidden="true"
          />
          {SCHEDULE_UI.legend_busy}
        </span>
      </div>
    </div>
  )
}
