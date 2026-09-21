import {
  CARD_UI,
  formatDate,
  localISODate,
  PERIOD_UI,
  SCHEDULE_UI,
  todayISO,
} from '@e-dentist/shared'
import { cn } from 'cn'
import {
  CalendarCheckIcon,
  CalendarOffIcon,
  CalendarPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from 'lucide-react'
import { useState } from 'react'
import {
  type Appointment,
  type TimeBlock,
  useAppointments,
  useTimeBlocks,
} from '@/entities/appointment'
import { useHasPermission } from '@/entities/session'
import { useDoctors } from '@/entities/staff'
import {
  AppointmentFormDialog,
  TimeBlockDialog,
  useDeleteAppointment,
  useDeleteTimeBlock,
  useSetAppointmentStatus,
} from '@/features/appointment-form'
import { VisitFormDialog } from '@/features/visit-form'
import { useSwipe } from '@/shared/lib'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import type { AppointmentActions } from './AppointmentMenu'
import { DayStrip } from './DayStrip'
import { MonthView } from './MonthView'
import { groupByDay, isoOf, monthTitle, parseIso, shiftDays, weekOf } from './scheduleUtils'
import { TimeGrid } from './TimeGrid'

type View = 'day' | 'week' | 'month'
const VIEW_KEY = 'edentist-schedule-view'
/// Radix Select boʻsh satrni qabul qilmaydi — «hammasi» uchun belgi
const ALL_DOCTORS = '__all__'

/// Sukut: telefonda kun (hafta toʻri tor), keng ekranda hafta; tanlov saqlanadi
function initialView(): View {
  try {
    const saved = localStorage.getItem(VIEW_KEY)
    if (saved === 'day' || saved === 'week' || saved === 'month') return saved
  } catch {
    // saqlanmagan boʻlsa sukut
  }
  return window.innerWidth < 768 ? 'day' : 'week'
}

/// Koʻrinishga qarab soʻrov oraligʻi va sarlavha
function rangeOf(view: View, selected: string): { from: string; to: string; title: string } {
  if (view === 'day') return { from: selected, to: selected, title: formatDate(selected) }
  if (view === 'week') {
    const days = weekOf(selected)
    const from = days[0] as string
    const to = days[6] as string
    return { from, to, title: `${formatDate(from)} – ${formatDate(to)}` }
  }
  const date = parseIso(selected)
  const y = date.getFullYear()
  const m = date.getMonth()
  return {
    from: isoOf(y, m, 1),
    to: isoOf(y, m, new Date(y, m + 1, 0).getDate()),
    title: monthTitle(y, m),
  }
}

export function Schedule() {
  const today = todayISO()
  const [view, setView] = useState<View>(initialView)
  const [selected, setSelected] = useState(today)
  const [doctorFilter, setDoctorFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<{ date: string; time?: string }>({ date: today })
  const [editing, setEditing] = useState<Appointment | undefined>(undefined)
  const [deleting, setDeleting] = useState<Appointment | null>(null)
  // «Yakunlandi» — qilingan ish yoziladi, tashrif boʻladi (10.6)
  const [completing, setCompleting] = useState<Appointment | null>(null)
  // Shifokorning band vaqti
  const [blockOpen, setBlockOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>(undefined)
  const [deletingBlock, setDeletingBlock] = useState<TimeBlock | null>(null)
  const { mutateAsync: removeBlock } = useDeleteTimeBlock()

  const { mutateAsync: remove } = useDeleteAppointment()
  const { mutate: setStatus } = useSetAppointmentStatus()
  // `schedule.all` yoʻq (shifokor): server faqat oʻz qabullarini qaytaradi —
  // shifokor filtri va formadagi tanlov maʼnosiz (10.7)
  const seesAll = useHasPermission()('schedule.all')
  const { data: doctors } = useDoctors()

  const { from, to, title } = rangeOf(view, selected)
  const { data: appointments, isPending } = useAppointments(from, to, doctorFilter || undefined)
  const { data: blocks } = useTimeBlocks(from, to, doctorFilter || undefined)
  const byDay = groupByDay(appointments ?? [])

  function changeView(next: View) {
    setView(next)
    // Toʻrdan oyga oʻtganda sahifa aylantirilgan qoladi — kalendar tepada boʻlsin
    if (next === 'month') window.scrollTo({ top: 0 })
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // saqlanmasa ham joriy sessiyada ishlaydi
    }
  }

  function shift(by: number) {
    if (view === 'day') return setSelected(shiftDays(selected, by))
    if (view === 'week') return setSelected(shiftDays(selected, by * 7))
    const date = parseIso(selected)
    const next = new Date(date.getFullYear(), date.getMonth() + by, 1)
    setSelected(isoOf(next.getFullYear(), next.getMonth(), 1))
  }

  function openNew(date = selected, time?: string) {
    setEditing(undefined)
    setDraft({ date, time })
    setFormOpen(true)
  }

  const actions: AppointmentActions = {
    onStatus: (item, status) => setStatus({ id: item.id, status }),
    onComplete: setCompleting,
    onEdit: (item) => {
      setEditing(item)
      setFormOpen(true)
    },
    onDelete: setDeleting,
  }

  const showToday = !(today >= from && today <= to) || (view === 'month' && selected !== today)
  // T3: chapga surish — keyingi davr, oʻngga — oldingi
  const swipe = useSwipe(
    () => shift(1),
    () => shift(-1),
  )

  const openBlock = () => {
    setEditingBlock(undefined)
    setBlockOpen(true)
  }

  const doctorSelect = seesAll && (
    <Select
      value={doctorFilter || ALL_DOCTORS}
      onValueChange={(value) => setDoctorFilter(value === ALL_DOCTORS ? '' : value)}
    >
      <SelectTrigger
        size="sm"
        className="min-w-0 flex-1 md:w-48 md:flex-none"
        aria-label={SCHEDULE_UI.doctor}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_DOCTORS}>{SCHEDULE_UI.all_doctors}</SelectItem>
        {doctors?.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.fullName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const viewSwitch = (
    <div className="bg-muted flex shrink-0 rounded-md p-0.5">
      {(
        [
          ['day', SCHEDULE_UI.view_day],
          ['week', SCHEDULE_UI.view_week],
          ['month', SCHEDULE_UI.view_month],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={view === key}
          onClick={() => changeView(key)}
          className={cn(
            'rounded px-2 py-1.5 text-[13px] transition-colors sm:px-3 sm:text-sm',
            view === key ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <>
      {/* Keng ekran: sarlavha va amallar. Telefonda joy tejaladi — sarlavha
          yoʻq, amallar pastki oʻngdagi «+» tugmasida */}
      <div className="mb-3 hidden items-center justify-between gap-2 md:flex">
        <h1 className="text-2xl font-semibold tracking-tight">{SCHEDULE_UI.title}</h1>
        <div className="flex items-center gap-2">
          {doctorSelect}
          <Button
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            aria-label={SCHEDULE_UI.block_add}
            title={SCHEDULE_UI.block_add}
            onClick={openBlock}
          >
            <CalendarOffIcon />
          </Button>
          <Button size="sm" onClick={() => openNew()}>
            <PlusIcon />
            {SCHEDULE_UI.add}
          </Button>
        </div>
      </div>

      {/* Yopishqoq blok: davr/koʻrinish qatori va hafta tasmasi — toʻr uzun,
          kunni almashtirish uchun tepaga qaytish shart boʻlmasin */}
      <div
        data-sticky="schedule"
        className="bg-background sticky top-14 z-20 -mx-4 mb-3 border-b px-4 md:-mx-6 md:px-6"
      >
        {/* Telefon: bitta ixcham qator — shifokor · koʻrinish · bugun.
            Sana hafta tasmasida; oy koʻrinishida — alohida qator */}
        <div className="flex items-center gap-2 py-2 md:hidden">
          {doctorSelect || (
            <span className="flex-1 truncate text-sm font-semibold">{SCHEDULE_UI.title}</span>
          )}
          {viewSwitch}
          {/* Doim joyida: paydo boʻlib qatorni surib yubormasin */}
          <Button
            variant="ghost"
            size="icon"
            className={cn('size-8 shrink-0', !showToday && 'invisible')}
            tabIndex={showToday ? 0 : -1}
            aria-hidden={!showToday}
            aria-label={SCHEDULE_UI.today}
            title={SCHEDULE_UI.today}
            onClick={() => setSelected(today)}
          >
            <CalendarCheckIcon />
          </Button>
        </div>
        {view === 'month' && (
          <div className="flex items-center justify-center gap-1 pb-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={PERIOD_UI.prev}
              onClick={() => shift(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-40 text-center text-sm font-semibold tabular-nums">{title}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={PERIOD_UI.next}
              onClick={() => shift(1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        )}

        {/* Keng ekran: davr almashtirgich + koʻrinish */}
        <div className="hidden items-center justify-between gap-2 py-2 md:flex">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={PERIOD_UI.prev}
              onClick={() => shift(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-56 text-center font-semibold tabular-nums">{title}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={PERIOD_UI.next}
              onClick={() => shift(1)}
            >
              <ChevronRightIcon />
            </Button>
            {/* Doim joyida: paydo boʻlib «›» ni surib yubormasin — tez bosganda
                «Bugun» ga tushib qaytib qolardi */}
            <Button
              variant="outline"
              size="sm"
              className={cn(!showToday && 'invisible')}
              tabIndex={showToday ? 0 : -1}
              aria-hidden={!showToday}
              onClick={() => setSelected(today)}
            >
              {SCHEDULE_UI.today}
            </Button>
          </div>
          {viewSwitch}
        </div>

        {/* Hafta tasmasi: haftada — toʻr ustunlari tepasida (kun bosilsa kun
            koʻrinishi); kun koʻrinishida faqat telefonda — kunni tanlash */}
        {view === 'week' && (
          <DayStrip
            days={weekOf(selected)}
            today={today}
            onPick={(day) => {
              setSelected(day)
              changeView('day')
            }}
            onShift={(by) => shift(by)}
          />
        )}
        {view === 'day' && (
          <DayStrip
            className="md:hidden"
            days={weekOf(selected)}
            today={today}
            selected={selected}
            onPick={setSelected}
            onShift={(by) => setSelected(shiftDays(selected, by * 7))}
          />
        )}
      </div>

      <div {...swipe}>
        {view === 'month' ? (
          <MonthView
            year={parseIso(selected).getFullYear()}
            month={parseIso(selected).getMonth()}
            today={today}
            selected={selected}
            onSelect={setSelected}
            byDay={byDay}
            loading={isPending && !appointments}
            actions={actions}
          />
        ) : (
          <TimeGrid
            key={view}
            days={view === 'day' ? [selected] : weekOf(selected)}
            today={today}
            byDay={byDay}
            blocks={blocks ?? []}
            loading={isPending && !appointments}
            actions={actions}
            onPickSlot={(date, time) => openNew(date, time)}
            onEditBlock={(block) => {
              setEditingBlock(block)
              setBlockOpen(true)
            }}
            onDeleteBlock={setDeletingBlock}
          />
        )}
      </div>

      {/* Telefon: suzuvchi «+» — dok tepasida, oʻngda; qabul yoki band vaqt */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            aria-label={SCHEDULE_UI.add}
            className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-30 size-14 rounded-full shadow-lg md:hidden [&_svg]:size-6"
          >
            <PlusIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" sideOffset={8} className="w-52">
          <DropdownMenuItem onSelect={() => openNew()}>
            <CalendarPlusIcon />
            {SCHEDULE_UI.add}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openBlock}>
            <CalendarOffIcon />
            {SCHEDULE_UI.block_add}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultDate={draft.date}
        defaultTime={draft.time}
        defaultDoctorId={doctorFilter || undefined}
        appointment={editing}
        ownOnly={!seesAll}
        onSaved={(saved) => {
          // Yozilgan qabul doim koʻrinsin: uning kuniga oʻtamiz; shifokor
          // filtri uni yashirsa — filtr olib tashlanadi
          const date = new Date(saved.at)
          setSelected(isoOf(date.getFullYear(), date.getMonth(), date.getDate()))
          if (doctorFilter && saved.doctorId !== doctorFilter) setDoctorFilter('')
        }}
      />

      <TimeBlockDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        defaultDate={selected}
        defaultDoctorId={doctorFilter || undefined}
        block={editingBlock}
        ownOnly={!seesAll}
      />

      <AlertDialog
        open={deletingBlock !== null}
        onOpenChange={(open) => !open && setDeletingBlock(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{SCHEDULE_UI.block_delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{SCHEDULE_UI.delete_text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingBlock) await removeBlock(deletingBlock.id)
                setDeletingBlock(null)
              }}
            >
              {CARD_UI.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {completing && (
        <VisitFormDialog
          open
          onOpenChange={(open) => !open && setCompleting(null)}
          patientId={completing.patientId}
          appointment={{
            id: completing.id,
            doctorId: completing.doctorId,
            date: localISODate(completing.at),
          }}
        />
      )}

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
