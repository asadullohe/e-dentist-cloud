import { SCHEDULE_UI, todayISO } from '@e-dentist/shared'
import { cn } from 'cn'
import { ClockIcon, PencilLineIcon, WandSparklesIcon } from 'lucide-react'
import { useState } from 'react'
import { type Appointment, useAppointments, useTimeBlocks } from '@/entities/appointment'
import { Button, Label, Skeleton, TimePicker } from '@/shared/ui'
import { type BusyRange, busyRanges, DURATIONS, minutesOf, overlaps, timeOfMinutes } from './slots'
import { TimeGridPicker } from './TimeGridPicker'
import { useAutoSlot } from './useAutoSlot'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/// Qabul formasining «Vaqt» qismi: natija kartasi (boshlanish – tugash ·
/// davomiylik), davomiylik chiplari va soat × chorak toʻri. Nostandart vaqt
/// (08:10) uchun «Qoʻlda» — kartada vaqt maydoni ochiladi. Shifokor
/// tanlanmagan boʻlsa band vaqtlar koʻrsatilmaydi (hammaniki aralashmasin)
export function TimeSection({
  date,
  doctorId,
  time,
  duration,
  excludeId,
  error,
  onTime,
  onDuration,
  onDate,
}: {
  /// YYYY-MM-DD yoki null (sana notoʻgʻri)
  date: string | null
  doctorId: string | null
  time: string
  duration: number
  excludeId?: string
  error?: string
  onTime: (time: string) => void
  onDuration: (minutes: number) => void
  /// «Keyingi boʻsh kunga oʻtish» — sana formada
  onDate?: (iso: string) => void
}) {
  const [manual, setManual] = useState(false)
  const valid = TIME.test(time)
  const endTime = valid ? timeOfMinutes(minutesOf(time) + duration) : ''
  // Sana notoʻgʻri boʻlsa soʻrov bugunga ketadi — toʻr baribir chizilmaydi
  const queryDate = date ?? todayISO()
  const { data, isPending } = useAppointments(queryDate, queryDate, doctorId ?? undefined)
  const { data: blocks } = useTimeBlocks(queryDate, queryDate, doctorId ?? undefined)
  const busy: BusyRange[] = doctorId
    ? busyRanges(
        (data ?? []) as Appointment[],
        excludeId,
        blocks ?? [],
        queryDate,
        SCHEDULE_UI.block_default,
      )
    : []
  const conflict =
    valid && busy.some((r) => overlaps(r, minutesOf(time), minutesOf(time) + duration))
  const auto = useAutoSlot({
    date,
    doctorId,
    busy,
    duration,
    excludeId,
    blockLabel: SCHEDULE_UI.block_default,
    onTime,
  })
  // Tahrirda nostandart davomiylik (20 daq) boʻlsa, u ham chip boʻlib chiqadi
  const durations = DURATIONS.includes(duration as (typeof DURATIONS)[number])
    ? DURATIONS
    : [...DURATIONS, duration].sort((a, b) => a - b)

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-lg border px-3 py-2',
          valid ? 'border-primary/30 bg-primary/8' : 'bg-muted/40',
          (error || conflict) && 'border-destructive',
        )}
      >
        <ClockIcon className="text-primary size-4 shrink-0" aria-hidden="true" />
        {manual ? (
          <TimePicker value={time} onChange={onTime} className="w-24 shrink-0" autoFocus />
        ) : (
          <span
            className={cn(
              'text-base font-semibold tabular-nums',
              !valid && 'text-muted-foreground font-normal text-sm',
            )}
          >
            {valid ? `${time} – ${endTime}` : SCHEDULE_UI.time_unset}
          </span>
        )}
        {valid && (
          <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
            {manual ? `– ${endTime} · ` : ''}
            {SCHEDULE_UI.minutes(duration)}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary ml-auto h-7 px-2"
          aria-pressed={manual}
          onClick={() => setManual((v) => !v)}
        >
          <PencilLineIcon />
          {SCHEDULE_UI.manual}
        </Button>
      </div>
      {(error || conflict) && (
        <p className="text-destructive text-sm font-medium">{error || SCHEDULE_UI.overlap}</p>
      )}

      <div className="space-y-1.5">
        <Label>{SCHEDULE_UI.duration}</Label>
        <div className="flex gap-1.5">
          {durations.map((minutes) => (
            <button
              key={minutes}
              type="button"
              aria-pressed={minutes === duration}
              onClick={() => onDuration(minutes)}
              className={cn(
                'h-8 flex-1 rounded-md border text-[13px] tabular-nums transition-colors',
                minutes === duration
                  ? 'border-primary bg-primary text-primary-foreground font-semibold'
                  : 'hover:bg-accent',
              )}
            >
              {minutes}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label>{SCHEDULE_UI.time}</Label>
          {doctorId ? (
            // Vaqtni tizim topadi, koʻrsatadi — saqlash qoʻlda (qaror 22/09/2026)
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!date || auto.searching}
              onClick={() => void auto.place()}
            >
              <WandSparklesIcon className="size-3.5" />
              {SCHEDULE_UI.auto_slot}
            </Button>
          ) : (
            <span className="text-muted-foreground text-xs">{SCHEDULE_UI.busy_needs_doctor}</span>
          )}
        </div>
        {auto.result?.kind === 'next' && (
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
            {SCHEDULE_UI.auto_slot_none}.{' '}
            {SCHEDULE_UI.auto_slot_next(auto.result.label, auto.result.time)}
            {onDate && (
              <button
                type="button"
                className="text-primary font-medium"
                onClick={() => {
                  if (auto.result?.kind !== 'next') return
                  onDate(auto.result.date)
                  onTime(auto.result.time)
                  auto.clear()
                }}
              >
                {SCHEDULE_UI.auto_slot_go}
              </button>
            )}
          </p>
        )}
        {auto.result?.kind === 'none' && (
          <p className="text-destructive text-xs">{SCHEDULE_UI.auto_slot_none_ahead}</p>
        )}
        {date ? (
          doctorId && isPending ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <TimeGridPicker busy={busy} time={time} duration={duration} onPick={onTime} />
          )
        ) : (
          <p className="text-muted-foreground text-xs">{SCHEDULE_UI.date_unreadable}</p>
        )}
      </div>
    </div>
  )
}
