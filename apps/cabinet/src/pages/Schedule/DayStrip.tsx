import { MONTHS_SHORT, WEEKDAYS } from '@e-dentist/shared'
import { cn } from 'cn'
import type { Ref } from 'react'
import { useSwipe } from '@/shared/lib'
import { COLUMNS_TEMPLATE, mondayFirst, parseIso } from './scheduleUtils'

/// Hafta tasmasi: Du 21 · Se 22 … Yak 27. Chap katak — vaqt oʻqi kengligida,
/// oy va yil shu yerda (davr qatori telefonda yoʻq). Kun bosilsa tanlanadi,
/// surilsa hafta almashadi. Hafta koʻrinishida toʻr ustunlari bilan bir xil
/// toʻrda — kunlar ustunlar tepasiga toʻgʻri tushadi
export function DayStrip({
  days,
  today,
  selected,
  onPick,
  onShift,
  className,
  aligned,
  ref,
  onScroll,
}: {
  days: readonly string[]
  today: string
  /// Kun koʻrinishida tanlangan kun ajratiladi; haftada hammasi koʻrinadi
  selected?: string
  onPick: (iso: string) => void
  onShift: (by: -1 | 1) => void
  className?: string
  /// Hafta koʻrinishida tasma toʻr ustunlari tepasida turadi — oʻsha
  /// kengliklar bilan va toʻr yonga surilganda u bilan birga (ref)
  aligned?: boolean
  ref?: Ref<HTMLDivElement>
  /// Tasma surilganda toʻr ham u bilan birga suriladi
  onScroll?: (left: number) => void
}) {
  const swipe = useSwipe(
    () => onShift(1),
    () => onShift(-1),
  )
  // Oy — tasmaning oʻrtasidagi (payshanba) kun boʻyicha: hafta ikki oyga
  // boʻlinganda koʻpchilik kunlar qaysi oyda boʻlsa, oʻsha
  const middle = parseIso(days[3] ?? days[0] ?? today)

  return (
    <div
      ref={ref}
      onScroll={(event) => onScroll?.(event.currentTarget.scrollLeft)}
      className={cn(
        aligned &&
          '[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:h-1.5 overflow-x-auto pb-1.5 [scrollbar-width:thin]',
        className,
      )}
    >
      <div
        {...swipe}
        className="grid items-end"
        style={{
          gridTemplateColumns: aligned ? COLUMNS_TEMPLATE(days.length) : '2.75rem repeat(7, 1fr)',
        }}
      >
        <div className="text-muted-foreground pb-1.5 pl-1 text-[10px] leading-tight">
          <div className="font-medium">{MONTHS_SHORT[middle.getMonth()]}</div>
          <div className="tabular-nums">{middle.getFullYear()}</div>
        </div>
        {days.map((day) => {
          const date = parseIso(day)
          const isToday = day === today
          const isSelected = day === selected
          return (
            <button
              key={day}
              type="button"
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => onPick(day)}
              className="flex flex-col items-center gap-0.5 py-1.5"
            >
              <span
                className={cn(
                  'text-[11px]',
                  isSelected || isToday ? 'text-primary font-medium' : 'text-muted-foreground',
                )}
              >
                {WEEKDAYS[mondayFirst(date)]}
              </span>
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                  // Tanlangan — toʻq doira; bugun (tanlanmagan) — koʻk raqam;
                  // haftada tanlov yoʻq, bugun toʻq doira
                  isSelected || (selected === undefined && isToday)
                    ? 'bg-primary text-primary-foreground'
                    : isToday && 'text-primary',
                )}
              >
                {date.getDate()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
