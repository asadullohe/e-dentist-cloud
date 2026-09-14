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
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Skeleton } from '@/shared/ui'

interface StatProps {
  label: string
  icon: LucideIcon
  value: ReactNode
  hint?: ReactNode
  loading?: boolean
}

/// Koʻrsatkich kartasi — Hisobotlar sahifasidagi bilan bir shaklda
function Stat({ label, icon: Icon, value, hint, loading = false }: StatProps) {
  return (
    <Card className="gap-2 py-5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="text-muted-foreground size-4" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        )}
        {hint && !loading && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
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
      value={formatSom(data?.summary.payments ?? 0)}
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
      value={formatSom(data?.totalDebt ?? 0)}
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
                    className="block truncate font-medium hover:underline"
                  >
                    {item.fio}
                  </Link>
                  {item.phone && (
                    <div className="text-muted-foreground truncate text-xs">
                      {formatUzPhone(item.phone)}
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
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
                    className="block truncate font-medium hover:underline"
                  >
                    {item.fio}
                  </Link>
                  {item.phone && (
                    <div className="text-muted-foreground truncate text-xs">
                      {formatUzPhone(item.phone)}
                    </div>
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

  const canSchedule = hasPermission('schedule.write')
  const canPatients = hasPermission('patients.read')
  const canReports = hasPermission('reports.read')
  const canPayments = hasPermission('payments.read')

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canSchedule && <TodayStat today={today} />}
        {canPatients && <PatientsStat month={month} canReports={canReports} />}
        {canReports && <IncomeStat month={month} />}
        {canPayments && <DebtStat />}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-7">
        {canSchedule && <TodayList today={today} className="lg:col-span-4" />}
        {canPayments && <TopDebtors className={canSchedule ? 'lg:col-span-3' : 'lg:col-span-7'} />}
      </div>
    </>
  )
}
