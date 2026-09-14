import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_UI,
  formatMonth,
  formatSom,
  REPORT_UI,
  todayISO,
} from '@e-dentist/shared'
import { cn } from 'cn'
import {
  CalendarCheckIcon,
  ChartColumnIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  type LucideIcon,
  ReceiptIcon,
  StethoscopeIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserPlusIcon,
  WalletIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useReport } from '@/entities/report'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { MonthsChart } from './MonthsChart'

const thisMonth = () => todayISO().slice(0, 7)

function shiftMonth(month: string, by: number): string {
  const [year, index] = month.split('-').map(Number) as [number, number]
  const date = new Date(year, index - 1 + by, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

interface StatProps {
  label: string
  value: string
  icon: LucideIcon
  /// Faqat salbiy natija ajratiladi (zarar) — qolgani neytral
  negative?: boolean
}

/// Koʻrsatkich kartasi: sarlavha va ikonka tepada, raqam pastda
function Stat({ label, value, icon: Icon, negative = false }: StatProps) {
  return (
    <Card className="gap-2 py-5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="text-muted-foreground size-4" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold tabular-nums', negative && 'text-destructive')}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

export function Reports() {
  const [month, setMonth] = useState(thisMonth)
  const { data, isPending } = useReport(month)

  const summary = data?.summary

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{REPORT_UI.title}</h1>
          <p className="text-muted-foreground text-sm">{REPORT_UI.subtitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={EXPENSE_UI.prev_month}
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-36 text-center font-semibold">{formatMonth(month)}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={EXPENSE_UI.next_month}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRightIcon />
          </Button>
          {month !== thisMonth() && (
            <Button variant="outline" size="sm" onClick={() => setMonth(thisMonth())}>
              {EXPENSE_UI.this_month}
            </Button>
          )}
        </div>
      </div>

      {isPending || !summary ? (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {['visits', 'charges', 'payments', 'expenses', 'profit', 'new'].map((key) => (
            <Skeleton key={key} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label={REPORT_UI.visits} value={String(summary.visits)} icon={CalendarCheckIcon} />
          <Stat
            label={REPORT_UI.charges}
            value={formatSom(summary.charges)}
            icon={StethoscopeIcon}
          />
          <Stat label={REPORT_UI.payments} value={formatSom(summary.payments)} icon={WalletIcon} />
          <Stat label={REPORT_UI.expenses} value={formatSom(summary.expenses)} icon={ReceiptIcon} />
          <Stat
            label={REPORT_UI.profit}
            value={formatSom(summary.profit)}
            icon={summary.profit >= 0 ? TrendingUpIcon : TrendingDownIcon}
            negative={summary.profit < 0}
          />
          <Stat
            label={REPORT_UI.new_patients}
            value={String(summary.newPatients)}
            icon={UserPlusIcon}
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
            <MonthsChart months={data.months} selected={month} onPick={setMonth} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
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
                  <TableHead className="w-20 text-right">{REPORT_UI.count}</TableHead>
                  <TableHead className="w-36 text-right">{REPORT_UI.total}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.topTreatments.map((row) => (
                  <TableRow key={row.treatment}>
                    <TableCell className="font-medium">{row.treatment}</TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
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
                  <TableHead className="w-20 text-right">{REPORT_UI.count}</TableHead>
                  <TableHead className="w-36 text-right">{REPORT_UI.total}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.topExpenses.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell className="font-medium">
                      {EXPENSE_CATEGORY_LABELS[row.category]}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
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
