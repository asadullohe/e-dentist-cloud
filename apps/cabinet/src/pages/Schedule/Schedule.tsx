import {
  CARD_UI,
  formatDate,
  getLocale,
  localISODate,
  PERIOD_UI,
  SCHEDULE_UI,
  todayISO,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { ru, uz } from 'date-fns/locale'
import {
  CalendarIcon,
  CalendarOffIcon,
  CalendarPlusIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from 'lucide-react'
import { useRef, useState } from 'react'
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
  useDeleteTimeBlock,
  useMoveAppointment,
  useSetAppointmentStatus,
} from '@/features/appointment-form'
import { VisitFormDialog } from '@/features/visit-form'

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
  Calendar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import { type AppointmentActions, AppointmentDetails } from './AppointmentDetails'
import { DayStrip } from './DayStrip'
import { type DoctorHead, DoctorStrip } from './DoctorStrip'
import { Segmented } from './Segmented'
import {
  type GridColumn,
  hourRange,
  isoOf,
  isoOfDate,
  parseIso,
  shiftDays,
  weekOf,
} from './scheduleUtils'
import { TimeGrid } from './TimeGrid'

/// Ikki koʻrinish: bugungi kun shifokorlar ustuni bilan yoki bir hafta
/// kunlar ustuni bilan. `schedule.all` yoʻq shifokorda «doctors» — oʻz kuni
type View = 'doctors' | 'week'
const VIEW_KEY = 'edentist-schedule-view'
/// Radix Select boʻsh satrni qabul qilmaydi — «hammasi» uchun belgi
const ALL_DOCTORS = '__all__'
/// Kalendar oy va hafta kunlarini ilova tilida koʻrsatadi
const CALENDAR_LOCALES = { uz, ru } as const

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

/// Koʻrinishga qarab soʻrov oraligʻi va sarlavha
function rangeOf(view: View, selected: string): { from: string; to: string; title: string } {
  if (view === 'doctors') return { from: selected, to: selected, title: formatDate(selected) }
  const days = weekOf(selected)
  const from = days[0] as string
  const to = days[6] as string
  return { from, to, title: `${formatDate(from)} – ${formatDate(to)}` }
}

export function Schedule() {
  const today = todayISO()
  const [view, setView] = useState<View>(() => stored(VIEW_KEY, ['doctors', 'week'], 'doctors'))
  const [selected, setSelected] = useState(today)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [doctorFilter, setDoctorFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<{ date: string; time?: string; doctorId?: string }>({
    date: today,
  })
  const [editing, setEditing] = useState<Appointment | undefined>(undefined)
  // Kartochka bosilganda ochiladigan tafsilot oynasi (telefonda tortma)
  const [details, setDetails] = useState<Appointment | null>(null)
  // «Yakunlandi» — qilingan ish yoziladi, tashrif boʻladi (10.6)
  const [completing, setCompleting] = useState<Appointment | null>(null)
  // Shifokorning band vaqti
  const [blockOpen, setBlockOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>(undefined)
  const [deletingBlock, setDeletingBlock] = useState<TimeBlock | null>(null)
  const { mutateAsync: removeBlock } = useDeleteTimeBlock()

  const { mutate: setStatus } = useSetAppointmentStatus()
  const { mutate: move } = useMoveAppointment()
  const canWrite = useHasPermission()('schedule.write')
  // `schedule.all` yoʻq (shifokor): server faqat oʻz qabullarini qaytaradi —
  // shifokor filtri va formadagi tanlov maʼnosiz (10.7)
  const seesAll = useHasPermission()('schedule.all')
  const { data: doctors } = useDoctors()
  // Toʻr va sarlavha tasmasi yonga birga suriladi: ikkalasi bir-birini
  // yetaklaydi (qiymat bir xil boʻlsa tegilmaydi — halqa boʻlmasin)
  const stripRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const syncScroll = (from: HTMLDivElement | null, left: number) => {
    if (from && from.scrollLeft !== left) from.scrollLeft = left
  }

  const { from, to, title } = rangeOf(view, selected)
  const { data: appointments, isPending } = useAppointments(from, to, doctorFilter || undefined)
  const { data: blocks } = useTimeBlocks(from, to, doctorFilter || undefined)

  const countOf = (doctorId: string | null) =>
    (appointments ?? []).filter((item) => item.doctorId === doctorId).length

  // Ustunlar: tanlangan shifokor boʻlsa — bitta. Shifokorsiz qabullar boʻlsa,
  // ular uchun oxirida alohida ustun
  const heads: DoctorHead[] = (doctors ?? [])
    .filter((doctor) => !doctorFilter || doctor.id === doctorFilter)
    .map((doctor) => ({
      id: doctor.id,
      name: doctor.fullName ?? SCHEDULE_UI.doctor_none,
      count: countOf(doctor.id),
    }))
  if (!doctorFilter && (appointments ?? []).some((item) => item.doctorId === null))
    heads.push({ id: null, name: SCHEDULE_UI.doctor_none, count: countOf(null) })

  // Shifokor faqat oʻz qabullarini koʻradi — unga ustunlar shart emas
  const byDoctor = view === 'doctors' && seesAll && heads.length > 0
  const days = view === 'doctors' ? [selected] : weekOf(selected)
  const columns: GridColumn[] = byDoctor
    ? heads.map((head) => ({ key: head.id ?? 'none', date: selected, doctorId: head.id }))
    : days.map((day) => ({ key: day, date: day }))
  // Toʻr ish soatlarini koʻrsatadi; tashqarida yozuv boʻlsa kengayadi
  const { startHour, endHour } = hourRange(appointments ?? [], blocks ?? [])

  function changeView(next: View) {
    setView(next)
    remember(VIEW_KEY, next)
  }

  function shift(by: number) {
    setSelected(shiftDays(selected, view === 'doctors' ? by : by * 7))
  }

  function openNew(date = selected, time?: string, doctorId?: string) {
    setEditing(undefined)
    setDraft({ date, time, doctorId })
    setFormOpen(true)
  }

  const actions: AppointmentActions = {
    onStatus: (item, status) => {
      setStatus({ id: item.id, status })
      // Oyna ochiq qolsin, lekin holat darhol yangilansin
      setDetails({ ...item, status })
    },
    onComplete: (item) => {
      setDetails(null)
      setCompleting(item)
    },
    onEdit: (item) => {
      setDetails(null)
      setEditing(item)
      setFormOpen(true)
    },
  }

  const showToday = !(today >= from && today <= to)

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

  // Ustun sarlavhalari: shifokorlar — avatar, ism va qabul soni; hafta —
  // kunlar tasmasi (kun bosilsa oʻsha kunga oʻtadi). Kun koʻrinishida tasma
  // faqat telefonda — kunni tanlash uchun
  const columnHeads = byDoctor ? (
    <DoctorStrip
      ref={stripRef}
      doctors={heads}
      onScroll={(left) => syncScroll(gridRef.current, left)}
    />
  ) : view === 'week' ? (
    <DayStrip
      ref={stripRef}
      aligned
      onScroll={(left) => syncScroll(gridRef.current, left)}
      days={days}
      today={today}
      onPick={(day) => {
        setSelected(day)
        changeView('doctors')
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

  // Sana — tugma: bosilsa kalendar. Shifokorga «Shifokorlar» emas «Kun»
  const dateButton = (
    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
      <PopoverTrigger asChild>
        {/* Telefonda qator tor — yozuv va ichki boʻshliq kichrayadi */}
        <Button
          variant="outline"
          size="sm"
          className="min-w-0 gap-1 px-2 text-xs font-semibold tabular-nums md:gap-1.5 md:px-3 md:text-sm"
        >
          <CalendarIcon />
          <span className="truncate">{title}</span>
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={CALENDAR_LOCALES[getLocale()]}
          selected={parseIso(selected)}
          defaultMonth={parseIso(selected)}
          onSelect={(date) => {
            if (date) setSelected(isoOfDate(date))
            setPickerOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )

  const viewSwitch = (
    <Segmented
      value={view}
      onChange={changeView}
      options={[
        ['doctors', seesAll ? SCHEDULE_UI.group_doctors : SCHEDULE_UI.view_day],
        ['week', SCHEDULE_UI.view_week],
      ]}
    />
  )

  return (
    <>
      {/* Keng ekran: sahifa nomi va shifokor filtri. Amallar yopishqoq
          qatorda — aylantirilganda ham qoʻl ostida boʻlsin */}
      <div className="mb-3 hidden items-center justify-between gap-2 md:flex">
        <h1 className="text-2xl font-semibold tracking-tight">{SCHEDULE_UI.title}</h1>
        {doctorSelect}
      </div>

      {/* Yopishqoq blok: boshqaruv qatori va ustun sarlavhalari — toʻr uzun,
          kunni almashtirish yoki qabul qoʻshish uchun tepaga qaytish shart emas */}
      <div
        data-sticky="schedule"
        className="bg-background sticky top-14 z-20 -mx-4 mb-3 border-b px-4 md:-mx-6 md:px-6"
      >
        {/* Telefon: ‹ sana › · koʻrinish. Surish endi ustunlarni aylantiradi,
            shuning uchun kun oʻqlar va kalendardan almashadi. Shifokor filtri
            bu yerda yoʻq — ustunlarning oʻzi shifokorni koʻrsatadi */}
        <div className="flex items-center gap-1 py-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label={PERIOD_UI.prev}
            onClick={() => shift(-1)}
          >
            <ChevronLeftIcon />
          </Button>
          {dateButton}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label={PERIOD_UI.next}
            onClick={() => shift(1)}
          >
            <ChevronRightIcon />
          </Button>
          <div className="ml-auto">{viewSwitch}</div>
        </div>

        {/* Keng ekran: ‹ sana › · bugun · koʻrinish · band vaqt · qabul qoʻshish */}
        <div className="hidden items-center gap-2 py-2 md:flex">
          <Button variant="ghost" size="icon" aria-label={PERIOD_UI.prev} onClick={() => shift(-1)}>
            <ChevronLeftIcon />
          </Button>
          {dateButton}
          <Button variant="ghost" size="icon" aria-label={PERIOD_UI.next} onClick={() => shift(1)}>
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
          <div className="ml-auto flex items-center gap-2">
            {viewSwitch}
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

        {columnHeads}
      </div>

      {/* Telefonda yonga surish ustunlarni aylantiradi (toʻr oʻzi suriladi) —
          kun sana tugmasi, ‹ › va hafta tasmasidan almashadi */}
      <div className="select-none">
        <TimeGrid
          key={view}
          columns={columns}
          startHour={startHour}
          endHour={endHour}
          today={today}
          appointments={appointments ?? []}
          blocks={blocks ?? []}
          loading={isPending && !appointments}
          onOpen={setDetails}
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
          scrollRef={gridRef}
          onScrollLeft={(left) => syncScroll(stripRef.current, left)}
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

      <AppointmentDetails item={details} onClose={() => setDetails(null)} actions={actions} />

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
    </>
  )
}
