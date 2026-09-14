import {
  APPOINTMENT_STATUS_LABELS,
  CARD_UI,
  EXPENSE_UI,
  formatDate,
  formatUzPhone,
  MONTHS,
  SCHEDULE_UI,
  todayISO,
  UI_TEXT,
  WEEKDAYS,
} from '@e-dentist/shared'
import { cn } from 'cn'
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type Appointment, type AppointmentStatus, useAppointments } from '@/entities/appointment'
import {
  AppointmentFormDialog,
  useDeleteAppointment,
  useSetAppointmentStatus,
} from '@/features/appointment-form'
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
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Skeleton,
} from '@/shared/ui'

const pad = (n: number) => String(n).padStart(2, '0')
const isoOf = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

/// Dushanbadan boshlanadigan hafta: getDay() da yakshanba 0, bizda oxirgi
const mondayFirst = (date: Date) => (date.getDay() + 6) % 7

const STATUSES: AppointmentStatus[] = ['scheduled', 'arrived', 'done', 'no_show', 'cancelled']

/// Holat belgisi: keldi — sariq, yakunlandi — yashil, kelmadi/bekor — qizil
function statusBadge(status: AppointmentStatus): string {
  if (status === 'done') return 'border-ok/30 bg-ok/10 text-ok'
  if (status === 'arrived') return 'border-warn/40 bg-warn/15 text-foreground'
  if (status === 'no_show' || status === 'cancelled')
    return 'border-destructive/30 bg-destructive/10 text-destructive'
  return ''
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })

function monthTitle(year: number, month: number): string {
  const name = MONTHS[month] ?? ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`
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
  const { mutate: setStatus } = useSetAppointmentStatus()

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

  function goToday() {
    const now = new Date()
    setCursor({ year: now.getFullYear(), month: now.getMonth() })
    setSelected(today)
  }

  const dayList = [...(byDay.get(selected) ?? [])].sort((a, b) => a.at.localeCompare(b.at))
  const isCurrentMonth = selected.slice(0, 7) === `${cursor.year}-${pad(cursor.month + 1)}`

  function openNew() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(item: Appointment) {
    setEditing(item)
    setFormOpen(true)
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{SCHEDULE_UI.title}</h1>
        <Button size="sm" onClick={openNew}>
          <PlusIcon />
          {SCHEDULE_UI.add}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card className="gap-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{monthTitle(cursor.year, cursor.month)}</CardTitle>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {SCHEDULE_UI.month_total(appointments?.length ?? 0)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {(selected !== today || !isCurrentMonth) && (
                <Button variant="outline" size="sm" onClick={goToday}>
                  {SCHEDULE_UI.today}
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label={EXPENSE_UI.prev_month}
                onClick={() => shift(-1)}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label={EXPENSE_UI.next_month}
                onClick={() => shift(1)}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-xs font-medium">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {isPending && !appointments ? (
              <Skeleton className="mt-1 h-72 w-full" />
            ) : (
              <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map(({ key, day }) => {
                  if (day === null) return <div key={key} />
                  const count = byDay.get(key)?.length ?? 0
                  const isSelected = selected === key
                  const isToday = key === today
                  return (
                    // Katak: raqam tepada, qabullar soni pastda. Bugun — toʻq
                    // doira, tanlangan kun — koʻk hoshiya
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelected(key)}
                      aria-pressed={isSelected}
                      className={cn(
                        'flex min-h-14 flex-col items-start gap-1 rounded-md border p-1.5 text-left text-sm transition-colors sm:min-h-16',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent border-transparent',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-6 items-center justify-center rounded-full tabular-nums',
                          isToday && 'bg-primary text-primary-foreground font-semibold',
                        )}
                      >
                        {day}
                      </span>
                      {count > 0 && (
                        <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[11px] leading-none font-medium tabular-nums">
                          {SCHEDULE_UI.day_total(count)}
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
                        className="block truncate font-medium hover:underline"
                      >
                        {item.fio}
                      </Link>
                      {item.phone && (
                        <div className="text-muted-foreground text-xs">
                          {formatUzPhone(item.phone)}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-muted-foreground mt-0.5 text-xs">{item.note}</div>
                      )}
                      <Badge
                        variant="outline"
                        className={cn('mt-1.5 text-[11px]', statusBadge(item.status))}
                      >
                        {APPOINTMENT_STATUS_LABELS[item.status]}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mr-1 size-8 shrink-0 data-[state=open]:bg-muted"
                          aria-label={SCHEDULE_UI.set_status}
                        >
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>{SCHEDULE_UI.set_status}</DropdownMenuLabel>
                        {STATUSES.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            disabled={status === item.status}
                            onClick={() => setStatus({ id: item.id, status })}
                          >
                            <span className="flex-1">{APPOINTMENT_STATUS_LABELS[status]}</span>
                            {status === item.status && <CheckIcon className="size-4" />}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/patients/${item.patientId}`}>
                            <UserIcon />
                            {SCHEDULE_UI.open_card}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(item)}>
                          <PencilIcon />
                          {UI_TEXT.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(item)}>
                          <Trash2Icon />
                          {UI_TEXT.remove}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
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
