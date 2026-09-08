import {
  APPOINTMENT_STATUS_LABELS,
  CARD_UI,
  formatDate,
  formatUzPhone,
  MONTHS,
  SCHEDULE_UI,
  todayISO,
  WEEKDAYS,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { type Appointment, useAppointments } from '@/entities/appointment'
import { AppointmentFormDialog, useDeleteAppointment } from '@/features/appointment-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton,
} from '@/shared/ui'

const pad = (n: number) => String(n).padStart(2, '0')
const isoOf = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

/// Dushanbadan boshlanadigan hafta: getDay() da yakshanba 0, bizda oxirgi
const mondayFirst = (date: Date) => (date.getDay() + 6) % 7

function statusTone(status: string): string {
  if (status === 'done') return 'bg-ok/15 text-ok border-ok/30'
  if (status === 'no_show' || status === 'cancelled')
    return 'bg-destructive/10 text-destructive border-destructive/30'
  if (status === 'arrived') return 'bg-warn/15 text-warn border-warn/30'
  return ''
}

export function Schedule() {
  const today = todayISO()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selected, setSelected] = useState(today)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | undefined>(undefined)
  const [deleting, setDeleting] = useState<Appointment | null>(null)

  const { mutateAsync: remove } = useDeleteAppointment()

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const from = isoOf(cursor.year, cursor.month, 1)
  const to = isoOf(cursor.year, cursor.month, daysInMonth)
  const { data: appointments, isPending } = useAppointments(from, to)

  // Kun boʻyicha guruhlash — kalendar katakchalarida son koʻrsatish uchun
  const byDay = new Map<string, Appointment[]>()
  for (const item of appointments ?? []) {
    const key = item.at.slice(0, 10)
    byDay.set(key, [...(byDay.get(key) ?? []), item])
  }

  // Oy 1-kunidan oldingi boʻsh katakchalar — kaliti oldingi oy sanasidan olinadi
  const leading = mondayFirst(new Date(cursor.year, cursor.month, 1))
  const prevDays = new Date(cursor.year, cursor.month, 0).getDate()
  const cells: { key: string; day: number | null }[] = [
    ...Array.from({ length: leading }, (_, i) => ({
      key: isoOf(cursor.year, cursor.month - 1, prevDays - leading + i + 1),
      day: null,
    })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      key: isoOf(cursor.year, cursor.month, i + 1),
      day: i + 1,
    })),
  ]

  function shift(by: number) {
    const date = new Date(cursor.year, cursor.month + by, 1)
    setCursor({ year: date.getFullYear(), month: date.getMonth() })
  }

  const dayList = byDay.get(selected) ?? []

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{SCHEDULE_UI.title}</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <PlusIcon />
          {SCHEDULE_UI.add}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" onClick={() => shift(-1)}>
              <ChevronLeftIcon />
            </Button>
            <div className="text-center">
              <div className="font-display font-semibold">
                {MONTHS[cursor.month]?.replace(/^./, (c) => c.toUpperCase())} {cursor.year}
              </div>
              <div className="text-muted-foreground text-xs">
                {SCHEDULE_UI.month_total(appointments?.length ?? 0)}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => shift(1)}>
              <ChevronRightIcon />
            </Button>
          </div>

          <div className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-xs">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {isPending ? (
            <Skeleton className="mt-1 h-56 w-full" />
          ) : (
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map(({ key, day }) => {
                if (day === null) return <div key={key} />
                const iso = key
                const count = byDay.get(iso)?.length ?? 0
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelected(iso)}
                    className={cn(
                      'flex aspect-square flex-col items-center justify-center rounded-md border text-sm transition-colors',
                      selected === iso
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-accent border-transparent',
                      iso === today && selected !== iso && 'border-primary/40 font-semibold',
                    )}
                  >
                    <span className="tabular-nums">{day}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          'mt-0.5 size-1.5 rounded-full',
                          selected === iso ? 'bg-primary-foreground' : 'bg-primary',
                        )}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">{formatDate(selected)}</div>
            {selected === today && <Badge variant="secondary">{SCHEDULE_UI.today}</Badge>}
          </div>

          {dayList.length === 0 ? (
            <EmptyState icon="🗓" text={SCHEDULE_UI.empty_day} />
          ) : (
            <ul className="space-y-2">
              {dayList.map((item) => (
                <li
                  key={item.id}
                  className={cn('rounded-md border px-2.5 py-2', statusTone(item.status))}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold tabular-nums">
                          {new Date(item.at).toLocaleTimeString('uz', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="truncate text-sm">{item.fio}</span>
                      </div>
                      {item.phone && (
                        <div className="text-muted-foreground text-xs">
                          {formatUzPhone(item.phone)}
                        </div>
                      )}
                      <div className="text-xs">{APPOINTMENT_STATUS_LABELS[item.status]}</div>
                      {item.note && (
                        <div className="text-muted-foreground text-xs">{item.note}</div>
                      )}
                    </div>
                    <div className="flex shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(item)
                          setFormOpen(true)
                        }}
                      >
                        <PencilIcon />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(item)}>
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultDate={selected}
        appointment={editing}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{SCHEDULE_UI.delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{SCHEDULE_UI.delete_text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleting) await remove(deleting.id)
                setDeleting(null)
              }}
            >
              {CARD_UI.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
