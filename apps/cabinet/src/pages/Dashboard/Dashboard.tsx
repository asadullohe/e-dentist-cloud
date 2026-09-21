import {
  APPOINTMENT_STATUS_LABELS,
  formatDate,
  formatSom,
  formatUzPhone,
  HOME_UI,
  SECTION_LABELS,
  todayISO,
  UI_TEXT,
} from '@e-dentist/shared'
import { cn } from 'cn'
import {
  ArrowRightIcon,
  CalendarIcon,
  CreditCardIcon,
  type LucideIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { type Appointment, useAppointments } from '@/entities/appointment'
import { useDebtors } from '@/entities/debtor'
import { usePatients } from '@/entities/patient'
import { useReport } from '@/entities/report'
import { useHasPermission, useSession } from '@/entities/session'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Money,
  Skeleton,
} from '@/shared/ui'
import { FeedbackWidget } from './FeedbackWidget'

interface StatProps {
  label: string
  icon: LucideIcon
  value: ReactNode
  hint?: ReactNode
  loading?: boolean
  /// Pul summasi telefonda yarim ustunga sigʻmaydi — butun qatorni oladi
  wide?: boolean
}

/// Koʻrsatkich kartasi — Hisobotlar sahifasidagi bilan bir shaklda
/// Telefonda ikki ustun va ixcham: toʻrt karta bir ekranga sigʻadi
function Stat({ label, icon: Icon, value, hint, loading = false, wide = false }: StatProps) {
  return (
    <Card
      className={cn('min-w-0 gap-1.5 py-4 sm:gap-2 sm:py-5', wide && 'col-span-2 sm:col-span-1')}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="truncate text-xs font-medium sm:text-sm">{label}</CardTitle>
        <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-24 sm:h-8 sm:w-28" />
        ) : (
          <div className="truncate text-xl font-bold tabular-nums sm:text-2xl">{value}</div>
        )}
        {hint && !loading && <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p>}
      </CardContent>
    </Card>
  )
}

/// Holat rangi kichik nuqta bilan — jadval sahifasidagi ranglar
function statusDot(status: Appointment['status']): string {
  if (status === 'done') return 'bg-ok'
  if (status === 'arrived') return 'bg-warn'
  if (status === 'no_show' || status === 'cancelled') return 'bg-destructive'
  return 'bg-primary'
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })

// Har blok oʻz soʻrovini oʻzi qiladi: ruxsat boʻlmasa blok umuman
// chizilmaydi va soʻrov ketmaydi. Bir xil kalitli soʻrovlar (bugungi
// qabullar, qarzdorlar) TanStack Query da bitta boʻlib ketadi

function TodayStat({ today }: { today: string }) {
  const { data, isPending } = useAppointments(today, today)
  const arrived = data?.filter((a) => a.status === 'arrived' || a.status === 'done').length ?? 0
  return (
    <Stat
      label={HOME_UI.today_appointments}
      icon={CalendarIcon}
      value={data?.length ?? 0}
      hint={HOME_UI.arrived(arrived)}
      loading={isPending}
    />
  )
}

function PatientsStat({ month, canReports }: { month: string; canReports: boolean }) {
  // Faqat soni kerak — bitta yozuvli sahifa yetadi
  const { data, isPending } = usePatients({ page: 1, pageSize: 1 })
  return (
    <Stat
      label={HOME_UI.patients}
      icon={UsersIcon}
      value={data?.total ?? 0}
      hint={canReports && <NewPatientsHint month={month} />}
      loading={isPending}
    />
  )
}

function NewPatientsHint({ month }: { month: string }) {
  const { data } = useReport(month)
  return data ? HOME_UI.new_this_month(data.summary.newPatients) : null
}

function IncomeStat({ month }: { month: string }) {
  const { data, isPending } = useReport(month)
  return (
    <Stat
      label={HOME_UI.month_income}
      icon={WalletIcon}
      wide
      value={<Money value={data?.summary.payments ?? 0} />}
      hint={HOME_UI.month_visits(data?.summary.visits ?? 0)}
      loading={isPending}
    />
  )
}

const TOP_DEBTORS = { page: 1, pageSize: 5, sort: 'debt', dir: 'desc' } as const

function DebtStat() {
  const { data, isPending } = useDebtors(TOP_DEBTORS)
  return (
    <Stat
      label={HOME_UI.debt}
      icon={CreditCardIcon}
      wide
      value={<Money value={data?.totalDebt ?? 0} />}
      hint={HOME_UI.debtors(data?.total ?? 0)}
      loading={isPending}
    />
  )
}

function TodayList({ today, className }: { today: string; className?: string }) {
  const { data, isPending } = useAppointments(today, today)
  const items = [...(data ?? [])].sort((a, b) => a.at.localeCompare(b.at))

  return (
    <Card className={cn('gap-3', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{HOME_UI.today_appointments}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/schedule">
            {HOME_UI.open_schedule}
            <ArrowRightIcon />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={CalendarIcon} text={HOME_UI.no_appointments} />
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <span className="w-12 shrink-0 font-medium tabular-nums">{time(item.at)}</span>
                <span
                  className={cn('size-2 shrink-0 rounded-full', statusDot(item.status))}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/patients/${item.patientId}`}
                    className="block font-medium hover:underline"
                  >
                    {item.fio}
                  </Link>
                  {(item.phone || item.doctorName) && (
                    <div className="text-muted-foreground text-xs">
                      {[item.phone && formatUzPhone(item.phone), item.doctorName]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">
                  {APPOINTMENT_STATUS_LABELS[item.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function TopDebtors({ className }: { className?: string }) {
  const { data, isPending } = useDebtors(TOP_DEBTORS)
  const items = data?.items ?? []

  return (
    <Card className={cn('gap-3', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{HOME_UI.top_debtors}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/debtors">
            {HOME_UI.all_debtors}
            <ArrowRightIcon />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={CreditCardIcon} text={HOME_UI.no_debtors} />
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.patientId} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/patients/${item.patientId}/tolovlar`}
                    className="block font-medium hover:underline"
                  >
                    {item.fio}
                  </Link>
                  {item.phone && (
                    <div className="text-muted-foreground text-xs">{formatUzPhone(item.phone)}</div>
                  )}
                </div>
                <span className="text-destructive shrink-0 font-semibold tabular-nums">
                  {formatSom(item.debt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { data: session } = useSession()
  const hasPermission = useHasPermission()
  const today = todayISO()
  const month = today.slice(0, 7)

  const canPatients = hasPermission('patients.read')
  // Qabullar roʻyxati serverda `patients.read` bilan ochiladi — ikkalasi kerak
  const canSchedule = hasPermission('schedule.write') && canPatients
  const canReports = hasPermission('reports.read')
  const canPayments = hasPermission('payments.read')
  const canFeedback = hasPermission(['feedback.read', 'feedback.own'])

  return (
    <>
      {/* Sarlavha — yon menyudagi nom bilan bir xil: foydalanuvchi qayerda
          turganini darhol bilsin. Salomlashish — pastda */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{SECTION_LABELS.home}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {UI_TEXT.welcome}, {session?.user.fullName} · {session?.clinic?.name} ·{' '}
          {formatDate(today)}
        </p>
      </div>

      {/* Toʻrt ustun faqat keng ekranda — pul summasi tor kartaga sigʻmaydi */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {canSchedule && <TodayStat today={today} />}
        {canPatients && <PatientsStat month={month} canReports={canReports} />}
        {canReports && <IncomeStat month={month} />}
        {canPayments && <DebtStat />}
      </div>

      {/* min-w-0: karta ichidagi uzun ism kartani ekrandan chiqarib yubormasin.
          Oʻng ustun: qarzdorlar va bemorlar bahosi ustma-ust */}
      <div className="mt-4 grid gap-4 lg:grid-cols-7 [&>*]:min-w-0">
        {canSchedule && <TodayList today={today} className="lg:col-span-4" />}
        {(canPayments || canFeedback) && (
          <div
            className={cn('flex flex-col gap-4', canSchedule ? 'lg:col-span-3' : 'lg:col-span-7')}
          >
            {canPayments && <TopDebtors />}
            {canFeedback && <FeedbackWidget month={month} />}
          </div>
        )}
      </div>
    </>
  )
}
