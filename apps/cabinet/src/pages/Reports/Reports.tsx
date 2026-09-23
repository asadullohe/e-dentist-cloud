import {
  EXPENSE_CATEGORY_LABELS,
  formatSom,
  type Period,
  periodRange,
  REPORT_UI,
  todayISO,
} from '@e-dentist/shared'
import { cn } from 'cn'
import {
  CalendarCheckIcon,
  ChartColumnIcon,
  type LucideIcon,
  ReceiptIcon,
  StethoscopeIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserPlusIcon,
  WalletIcon,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useReport } from '@/entities/report'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Money,
  PeriodNav,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { MonthsChart } from './MonthsChart'
import { PlanConversionCard } from './PlanConversionCard'

interface StatProps {
  label: string
  value: ReactNode
  icon: LucideIcon
  /// Faqat salbiy natija ajratiladi (zarar) — qolgani neytral
  negative?: boolean
  /// Pul summasi telefonda yarim ustunga sigʻmaydi — butun qatorni oladi
  wide?: boolean
}

/// Koʻrsatkich kartasi: sarlavha va ikonka tepada, raqam pastda
function Stat({ label, value, icon: Icon, negative = false, wide = false }: StatProps) {
  return (
    <Card
      className={cn('min-w-0 gap-1.5 py-4 sm:gap-2 sm:py-5', wide && 'col-span-2 sm:col-span-1')}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="truncate text-xs font-medium sm:text-sm">{label}</CardTitle>
        <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'truncate text-xl font-bold tabular-nums sm:text-2xl',
            negative && 'text-destructive',
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

export function Reports() {
  // Sukut — shu oy; tur (kun, hafta, oy, yil) va sana tanlovda oʻzgaradi
  const [period, setPeriod] = useState<Period>(() => ({ kind: 'month', anchor: todayISO() }))
  const range = periodRange(period)
  const { data, isPending } = useReport(range)
  // Grafikda davr oyi (oy koʻrinishida) belgilanadi; ustun bosilsa oʻsha oy
  const selectedMonth = period.kind === 'month' ? range.from.slice(0, 7) : ''

  const summary = data?.summary

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{REPORT_UI.title}</h1>
          <p className="text-muted-foreground text-sm">{REPORT_UI.subtitle}</p>
        </div>
        <PeriodNav value={period} onChange={setPeriod} />
      </div>

      {isPending || !summary ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {['visits', 'new', 'charges', 'payments', 'expenses', 'profit'].map((key, i) => (
            <Skeleton
              key={key}
              className={cn('h-24 w-full', i > 1 && 'col-span-2 sm:col-span-1')}
            />
          ))}
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <Stat label={REPORT_UI.visits} value={String(summary.visits)} icon={CalendarCheckIcon} />
          <Stat
            label={REPORT_UI.new_patients}
            value={String(summary.newPatients)}
            icon={UserPlusIcon}
          />
          <Stat
            label={REPORT_UI.charges}
            value={<Money value={summary.charges} />}
            icon={StethoscopeIcon}
            wide
          />
          <Stat
            label={REPORT_UI.payments}
            value={<Money value={summary.payments} />}
            icon={WalletIcon}
            wide
          />
          <Stat
            label={REPORT_UI.expenses}
            value={<Money value={summary.expenses} />}
            icon={ReceiptIcon}
            wide
          />
          <Stat
            label={REPORT_UI.profit}
            value={<Money value={summary.profit} />}
            icon={summary.profit >= 0 ? TrendingUpIcon : TrendingDownIcon}
            negative={summary.profit < 0}
            wide
          />
        </div>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{REPORT_UI.last_months}</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending || !data ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <MonthsChart
              months={data.months}
              selected={selectedMonth}
              onPick={(month) => setPeriod({ kind: 'month', anchor: `${month}-01` })}
            />
          )}
        </CardContent>
      </Card>

      {data && <PlanConversionCard data={data.plans} />}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="gap-3 overflow-hidden pb-0">
          <CardHeader>
            <CardTitle>{REPORT_UI.treatments_title}</CardTitle>
          </CardHeader>
          {data?.topTreatments.length === 0 ? (
            <EmptyState icon={ChartColumnIcon} text={REPORT_UI.empty_visits} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{REPORT_UI.treatment}</TableHead>
                  <TableHead className="hidden w-20 text-right sm:table-cell">
                    {REPORT_UI.count}
                  </TableHead>
                  <TableHead className="text-right sm:w-36">{REPORT_UI.total}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.topTreatments.map((row) => (
                  <TableRow key={row.treatment}>
                    {/* Uzun muolaja nomi oʻraladi — jadval ekrandan chiqmaydi */}
                    <TableCell className="font-medium whitespace-normal">{row.treatment}</TableCell>
                    <TableCell className="text-muted-foreground hidden text-right tabular-nums sm:table-cell">
                      {row.count}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatSom(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="gap-3 overflow-hidden pb-0">
          <CardHeader>
            <CardTitle>{REPORT_UI.expenses_title}</CardTitle>
          </CardHeader>
          {data?.topExpenses.length === 0 ? (
            <EmptyState icon={ReceiptIcon} text={REPORT_UI.empty_expenses} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{REPORT_UI.category}</TableHead>
                  <TableHead className="hidden w-20 text-right sm:table-cell">
                    {REPORT_UI.count}
                  </TableHead>
                  <TableHead className="text-right sm:w-36">{REPORT_UI.total}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.topExpenses.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell className="font-medium whitespace-normal">
                      {EXPENSE_CATEGORY_LABELS[row.category]}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-right tabular-nums sm:table-cell">
                      {row.count}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatSom(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  )
}
