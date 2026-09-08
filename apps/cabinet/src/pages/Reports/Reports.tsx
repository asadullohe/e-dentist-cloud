import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_UI,
  formatMonth,
  formatSom,
  REPORT_UI,
  todayISO,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import { useReport } from '@/entities/report'
import {
  Button,
  Card,
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
  tone?: 'ok' | 'warn' | 'bad'
}

function Stat({ label, value, tone }: StatProps) {
  return (
    <Card className="gap-1 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div
        className={cn(
          'font-display text-xl font-bold tabular-nums',
          tone === 'ok' && 'text-ok',
          tone === 'warn' && 'text-warn',
          tone === 'bad' && 'text-destructive',
        )}
      >
        {value}
      </div>
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
          <h1 className="font-display text-2xl font-bold tracking-tight">{REPORT_UI.title}</h1>
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
          <span className="font-display min-w-36 text-center font-semibold">
            {formatMonth(month)}
          </span>
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
        <Skeleton className="mb-4 h-24 w-full" />
      ) : (
        <div className="mb-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label={REPORT_UI.visits} value={String(summary.visits)} />
          <Stat label={REPORT_UI.charges} value={formatSom(summary.charges)} tone="warn" />
          <Stat label={REPORT_UI.payments} value={formatSom(summary.payments)} tone="ok" />
          <Stat label={REPORT_UI.expenses} value={formatSom(summary.expenses)} tone="bad" />
          <Stat
            label={REPORT_UI.profit}
            value={formatSom(summary.profit)}
            tone={summary.profit >= 0 ? 'ok' : 'bad'}
          />
          <Stat label={REPORT_UI.new_patients} value={String(summary.newPatients)} />
        </div>
      )}

      <Card className="mb-4 p-4">
        <h2 className="font-display font-semibold">{REPORT_UI.last_months}</h2>
        {isPending || !data ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <MonthsChart months={data.months} selected={month} onPick={setMonth} />
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-0 overflow-hidden p-0">
          <h2 className="font-display px-4 pt-4 pb-2 font-semibold">
            {REPORT_UI.treatments_title}
          </h2>
          {data?.topTreatments.length === 0 ? (
            <EmptyState icon="📊" text={REPORT_UI.empty_visits} />
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

        <Card className="gap-0 overflow-hidden p-0">
          <h2 className="font-display px-4 pt-4 pb-2 font-semibold">{REPORT_UI.expenses_title}</h2>
          {data?.topExpenses.length === 0 ? (
            <EmptyState icon="🧾" text={REPORT_UI.empty_expenses} />
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
