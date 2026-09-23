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
  useMoveAppointment,
  useSetAppointmentStatus,
} from '@/features/appointment-form'
import { VisitFormDialog } from '@/features/visit-form'
import { useMediaQuery, useSwipe } from '@/shared/lib'
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
import { type DoctorHead, DoctorStrip } from './DoctorStrip'
import { Segmented } from './Segmented'
import { type GridColumn, isoOf, shiftDays, weekOf } from './scheduleUtils'
import { TimeGrid } from './TimeGrid'

type Period = 'day' | 'week'
/// Ustunlar nima boʻyicha boʻlinadi: shifokorlar (kun) yoki kunlar (hafta)
type Group = 'doctors' | 'days'
const PERIOD_KEY = 'edentist-schedule-period'
const GROUP_KEY = 'edentist-schedule-group'
/// Radix Select boʻsh satrni qabul qilmaydi — «hammasi» uchun belgi
const ALL_DOCTORS = '__all__'

function stored<T extends string>(key: string, values: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return values.find((item) => item === value) ?? fallback
  } catch {
    // saqlanmagan boʻlsa sukut
    return fallback
  }
}

function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // saqlanmasa ham joriy sessiyada ishlaydi
  }
}

/// Davrga qarab soʻrov oraligʻi va sarlavha
function rangeOf(period: Period, selected: string): { from: string; to: string; title: string } {
  if (period === 'day') return { from: selected, to: selected, title: formatDate(selected) }
  const days = weekOf(selected)
  const from = days[0] as string
  const to = days[6] as string
  return { from, to, title: `${formatDate(from)} – ${formatDate(to)}` }
}

export function Schedule() {
  const today = todayISO()
  const [period, setPeriod] = useState<Period>(() => stored(PERIOD_KEY, ['day', 'week'], 'day'))
  const [group, setGroup] = useState<Group>(() => stored(GROUP_KEY, ['doctors', 'days'], 'doctors'))
  const [selected, setSelected] = useState(today)
  const [doctorFilter, setDoctorFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<{ date: string; time?: string; doctorId?: string }>({
    date: today,
  })
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
  const { mutate: move } = useMoveAppointment()
  const canWrite = useHasPermission()('schedule.write')
  // `schedule.all` yoʻq (shifokor): server faqat oʻz qabullarini qaytaradi —
  // shifokor filtri va formadagi tanlov maʼnosiz (10.7)
  const seesAll = useHasPermission()('schedule.all')
  const { data: doctors } = useDoctors()
  // Shifokor ustunlari telefonga sigʻmaydi — u yerda kunlar boʻyicha
  const wide = useMediaQuery('(min-width: 768px)')

  const { from, to, title } = rangeOf(period, selected)
  const { data: appointments, isPending } = useAppointments(from, to, doctorFilter || undefined)
  const { data: blocks } = useTimeBlocks(from, to, doctorFilter || undefined)

  // Ustun sarlavhalari: tanlangan shifokor boʻlsa — bitta ustun. Shifokorsiz
  // qabullar boʻlsa, ular uchun oxirida alohida ustun
  const heads: DoctorHead[] = (doctors ?? [])
    .filter((doctor) => !doctorFilter || doctor.id === doctorFilter)
    .map((doctor) => ({ id: doctor.id, name: doctor.fullName ?? SCHEDULE_UI.doctor_none }))
  if (!doctorFilter && (appointments ?? []).some((item) => item.doctorId === null))
    heads.push({ id: null, name: SCHEDULE_UI.doctor_none })

  const canGroup = seesAll && wide && period === 'day'
  const byDoctor = canGroup && group === 'doctors' && heads.length > 0
  const days = period === 'day' ? [selected] : weekOf(selected)
  const columns: GridColumn[] = byDoctor
    ? heads.map((head) => ({ key: head.id ?? 'none', date: selected, doctorId: head.id }))
    : days.map((day) => ({ key: day, date: day }))

  function changePeriod(next: Period) {
    setPeriod(next)
    remember(PERIOD_KEY, next)
  }

  function changeGroup(next: Group) {
    setGroup(next)
    remember(GROUP_KEY, next)
  }

  function shift(by: number) {
    setSelected(shiftDays(selected, period === 'day' ? by : by * 7))
  }

  function openNew(date = selected, time?: string, doctorId?: string) {
    setEditing(undefined)
    setDraft({ date, time, doctorId })
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

  const showToday = !(today >= from && today <= to)
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

  // Ustun sarlavhalari: shifokorlar — avatar va ism; hafta — kunlar tasmasi
  // (kun bosilsa oʻsha kunga oʻtadi); kunda tasma faqat telefonda — kun tanlash
  const columnHeads = byDoctor ? (
    <DoctorStrip doctors={heads} />
  ) : period === 'week' ? (
    <DayStrip
      days={days}
      today={today}
      onPick={(day) => {
        setSelected(day)
        changePeriod('day')
      }}
      onShift={(by) => shift(by)}
    />
  ) : (
    <DayStrip
      className="md:hidden"
      days={weekOf(selected)}
      today={today}
      selected={selected}
      onPick={setSelected}
      onShift={(by) => setSelected(shiftDays(selected, by * 7))}
    />
  )

  const periodSwitch = (
    <Segmented
      value={period}
      onChange={changePeriod}
      options={[
        ['day', SCHEDULE_UI.view_day],
        ['week', SCHEDULE_UI.view_week],
      ]}
    />
  )

  // Guruhlash faqat kunda maʼnoli: haftada ustunlar doim kunlar
  const groupSwitch = canGroup && (
    <Segmented
      value={group}
      onChange={changeGroup}
      options={[
        ['doctors', SCHEDULE_UI.group_doctors],
        ['days', SCHEDULE_UI.group_days],
      ]}
    />
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

      {/* Yopishqoq blok: davr/koʻrinish qatori va ustun sarlavhalari — toʻr uzun,
          kunni almashtirish uchun tepaga qaytish shart boʻlmasin */}
      <div
        data-sticky="schedule"
        className="bg-background sticky top-14 z-20 -mx-4 mb-3 border-b px-4 md:-mx-6 md:px-6"
      >
        {/* Telefon: bitta ixcham qator — shifokor · davr · bugun.
            Sana hafta tasmasida */}
        <div className="flex items-center gap-2 py-2 md:hidden">
          {doctorSelect || (
            <span className="flex-1 truncate text-sm font-semibold">{SCHEDULE_UI.title}</span>
          )}
          {periodSwitch}
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

        {/* Keng ekran: davr almashtirgich + guruhlash */}
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
          <div className="flex items-center gap-2">
            {groupSwitch}
            {periodSwitch}
          </div>
        </div>

        {columnHeads}
      </div>

      {/* Surish bilan davr almashadi; sichqoncha bilan surganda matn belgilanmasin */}
      <div {...swipe} className="select-none">
        <TimeGrid
          key={byDoctor ? 'doctors' : period}
          columns={columns}
          today={today}
          appointments={appointments ?? []}
          blocks={blocks ?? []}
          loading={isPending && !appointments}
          actions={actions}
          onPickSlot={(column, time) => openNew(column.date, time, column.doctorId ?? undefined)}
          onMove={
            canWrite
              ? (item, column, time) =>
                  move({
                    id: item.id,
                    date: column.date,
                    time,
                    // Kunlar rejimida ustun shifokorni bildirmaydi — oʻzgarmaydi
                    doctorId: column.doctorId,
                    doctorName: heads.find((head) => head.id === column.doctorId)?.name ?? null,
                  })
              : undefined
          }
          onShift={(by) => shift(by)}
          onEditBlock={(block) => {
            setEditingBlock(block)
            setBlockOpen(true)
          }}
          onDeleteBlock={setDeletingBlock}
        />
      </div>

      {/* Telefon: suzuvchi «+» — dok tepasida, oʻngda; qabul yoki band vaqt */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            aria-label={SCHEDULE_UI.add}
            className="fixed right-4 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)] z-30 size-14 rounded-full shadow-lg md:hidden [&_svg]:size-6"
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
        defaultDoctorId={draft.doctorId || doctorFilter || undefined}
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
