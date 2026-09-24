import { APPOINTMENT_STATUS_LABELS, SCHEDULE_UI, SECTION_LABELS } from '@e-dentist/shared'
import { cn } from 'cn'
import { BanknoteIcon, CalendarOffIcon, CalendarPlusIcon, UserSearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Appointment, AppointmentStatus, TimeBlock } from '@/entities/appointment'
import { useHasPermission } from '@/entities/session'
import { blockMinutes } from '@/features/appointment-form'
import { initialsOf, useMediaQuery } from '@/shared/lib'
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui'
import type { DoctorHead } from './ColumnHead'
import { pad, statusTone, timeOf } from './scheduleUtils'

/// Kartada koʻrsatiladigan holatlar — «rejalashtirilgan» jami sonda bor
const SHOWN: AppointmentStatus[] = ['arrived', 'done', 'no_show']
/// Boʻsh vaqt qidirishda qadam va eng kichik oraliq (daqiqa)
const SLOT = 30

/// Shu shifokorning kunidagi birinchi boʻsh oraliq: band vaqtlar va qabullar
/// ustidan qadamba-qadam yuriladi
function firstFree(
  items: readonly Appointment[],
  blocks: readonly TimeBlock[],
  date: string,
  startHour: number,
  endHour: number,
): string | null {
  const busy = [
    ...items
      .filter((item) => item.status !== 'cancelled')
      .map((item) => {
        const from = new Date(item.at)
        const start = from.getHours() * 60 + from.getMinutes()
        return { start, end: start + item.duration }
      }),
    ...blocks.map((block) => blockMinutes(block, date)).filter((span) => span !== null),
  ]
  for (let minutes = startHour * 60; minutes + SLOT <= endHour * 60; minutes += 15) {
    const free = busy.every((span) => minutes >= span.end || minutes + SLOT <= span.start)
    if (free) return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
  }
  return null
}

/// Jadval sarlavhasidagi shifokor: bosilsa u haqida karta ochiladi —
/// kim ekani, kuni qanday oʻtayotgani va tez amallar
export function DoctorCard({
  doctor,
  appointments,
  blocks,
  date,
  startHour,
  endHour,
  filtered,
  onFilter,
  onNew,
  onBlock,
}: {
  doctor: DoctorHead
  /// Shu shifokorning shu kundagi qabullari va band vaqtlari
  appointments: readonly Appointment[]
  blocks: readonly TimeBlock[]
  date: string
  startHour: number
  endHour: number
  filtered: boolean
  onFilter: () => void
  onNew: () => void
  onBlock: () => void
}) {
  const [open, setOpen] = useState(false)
  const wide = useMediaQuery('(min-width: 768px)')
  const can = useHasPermission()
  const canWrite = can('schedule.write')

  const trigger = (
    <button
      type="button"
      className="hover:bg-accent/60 -mx-1 flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors"
    >
      <span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
        {doctor.id === null ? '—' : initialsOf(doctor.name)}
      </span>
      <span className="truncate text-xs font-medium">{doctor.name}</span>
      <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">{doctor.count}</span>
    </button>
  )

  const free = firstFree(appointments, blocks, date, startHour, endHour)
  const body = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {doctor.id === null ? '—' : initialsOf(doctor.name)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{doctor.name}</div>
          {doctor.role && <div className="text-muted-foreground text-xs">{doctor.role}</div>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
          {SCHEDULE_UI.appointments_count(appointments.length)}
        </span>
        {SHOWN.map((status) => {
          const count = appointments.filter((item) => item.status === status).length
          if (count === 0) return null
          return (
            <span
              key={status}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium',
                statusTone(status).badge,
              )}
            >
              {count} · {APPOINTMENT_STATUS_LABELS[status]}
            </span>
          )
        })}
      </div>

      <div className="flex flex-col gap-1.5 border-t pt-2.5 text-sm">
        {blocks.length > 0 && (
          <div className="flex items-center gap-2">
            <CalendarOffIcon className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-xs">{SCHEDULE_UI.block}</span>
            <span className="ml-auto text-xs tabular-nums">
              {blocks
                .map((block) => `${timeOf(block.startsAt)} – ${timeOf(block.endsAt)}`)
                .join(', ')}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <CalendarPlusIcon className="text-muted-foreground size-4 shrink-0" />
          <span className="text-muted-foreground text-xs">{SCHEDULE_UI.first_free}</span>
          <span className={cn('ml-auto text-xs tabular-nums', free ? 'text-primary' : '')}>
            {free ?? SCHEDULE_UI.no_free}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t pt-2.5">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={() => {
            onFilter()
            setOpen(false)
          }}
        >
          <UserSearchIcon />
          {filtered ? SCHEDULE_UI.all_doctors : SCHEDULE_UI.only_doctor}
        </Button>
        {canWrite && doctor.id !== null && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => {
                onNew()
                setOpen(false)
              }}
            >
              <CalendarPlusIcon />
              {SCHEDULE_UI.add}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => {
                onBlock()
                setOpen(false)
              }}
            >
              <CalendarOffIcon />
              {SCHEDULE_UI.block_add}
            </Button>
          </>
        )}
        {can('payroll.manage') && doctor.id !== null && (
          <Button variant="ghost" size="sm" className="justify-start" asChild>
            <Link to="/payroll">
              <BanknoteIcon />
              {SECTION_LABELS.payroll}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )

  if (!wide) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-[28px] px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetTitle className="sr-only">{doctor.name}</SheetTitle>
          <div className="bg-foreground/15 mx-auto mb-3 h-1 w-10 shrink-0 rounded-full" />
          {body}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        {body}
      </PopoverContent>
    </Popover>
  )
}
