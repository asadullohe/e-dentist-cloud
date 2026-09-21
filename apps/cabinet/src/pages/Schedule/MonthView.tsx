import {
  APPOINTMENT_STATUS_LABELS,
  formatDate,
  formatUzPhone,
  SCHEDULE_UI,
  WEEKDAYS,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { CalendarIcon, MoreHorizontalIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Appointment } from '@/entities/appointment'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
} from '@/shared/ui'
import { type AppointmentActions, AppointmentMenu } from './AppointmentMenu'
import { isoOf, mondayFirst, statusBadge, timeOf } from './scheduleUtils'

/// Oylik koʻrinish: kalendar (kunda qabullar soni) + tanlangan kun roʻyxati
export function MonthView({
  year,
  month,
  today,
  selected,
  onSelect,
  byDay,
  loading,
  actions,
}: {
  year: number
  month: number
  today: string
  selected: string
  onSelect: (iso: string) => void
  byDay: Map<string, Appointment[]>
  loading: boolean
  actions: AppointmentActions
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Oy 1-kunidan oldingi boʻsh katakchalar — kaliti oldingi oy sanasidan olinadi
  const leading = mondayFirst(new Date(year, month, 1))
  const prevDays = new Date(year, month, 0).getDate()
  const cells: { key: string; day: number | null }[] = [
    ...Array.from({ length: leading }, (_, i) => ({
      key: isoOf(year, month - 1, prevDays - leading + i + 1),
      day: null,
    })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      key: isoOf(year, month, i + 1),
      day: i + 1,
    })),
  ]
  const dayList = [...(byDay.get(selected) ?? [])].sort((a, b) => a.at.localeCompare(b.at))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem] [&>*]:min-w-0">
      <Card className="gap-3">
        <CardContent className="px-3 sm:px-6">
          <div className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-xs font-medium">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
          {loading ? (
            <Skeleton className="mt-1 h-72 w-full" />
          ) : (
            <div className="mt-1 grid grid-cols-7 gap-0.5 sm:gap-1">
              {cells.map(({ key, day }) => {
                if (day === null) return <div key={key} />
                const count = byDay.get(key)?.length ?? 0
                const isSelected = selected === key
                return (
                  // Katak: raqam tepada, qabullar soni pastda. Bugun — toʻq
                  // doira, tanlangan kun — koʻk hoshiya
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelect(key)}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex min-h-14 min-w-0 flex-col items-start gap-1 rounded-md border p-1 text-left text-sm transition-colors sm:min-h-16 sm:p-1.5',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent border-transparent',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full tabular-nums',
                        key === today && 'bg-primary text-primary-foreground font-semibold',
                      )}
                    >
                      {day}
                    </span>
                    {count > 0 && (
                      <span className="bg-primary/10 text-primary rounded px-1 py-0.5 text-[10px] leading-none font-medium whitespace-nowrap tabular-nums sm:px-1.5 sm:text-[11px]">
                        <span className="sm:hidden">{count}</span>
                        <span className="hidden sm:inline">{SCHEDULE_UI.day_total(count)}</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{formatDate(selected)}</CardTitle>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {SCHEDULE_UI.day_total(dayList.length)}
            </p>
          </div>
          {selected === today && <Badge variant="secondary">{SCHEDULE_UI.today}</Badge>}
        </CardHeader>
        <CardContent>
          {dayList.length === 0 ? (
            <EmptyState icon={CalendarIcon} text={SCHEDULE_UI.empty_day} />
          ) : (
            <ul className="space-y-2">
              {dayList.map((item) => (
                <li key={item.id} className="flex items-start gap-3 rounded-md border p-2.5">
                  <span className="w-11 shrink-0 pt-0.5 font-semibold tabular-nums">
                    {timeOf(item.at)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/patients/${item.patientId}`}
                      className="block font-medium hover:underline"
                    >
                      {item.fio}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      {[item.phone && formatUzPhone(item.phone), item.doctorName]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    {item.note && (
                      <div className="text-muted-foreground mt-0.5 text-xs">{item.note}</div>
                    )}
                    <Badge
                      variant="outline"
                      className={cn('mt-1.5 text-[11px]', statusBadge(item.status))}
                    >
                      {APPOINTMENT_STATUS_LABELS[item.status]} ·{' '}
                      {SCHEDULE_UI.minutes(item.duration)}
                    </Badge>
                  </div>
                  <AppointmentMenu item={item} actions={actions}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mr-1 size-8 shrink-0 data-[state=open]:bg-muted"
                      aria-label={SCHEDULE_UI.set_status}
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </AppointmentMenu>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
