import {
  EXPENSE_UI,
  formatMonth,
  formatSom,
  PAYROLL_UI,
  shiftMonth,
  todayISO,
} from '@e-dentist/shared'
import { cn } from 'cn'
import {
  BanknoteIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HandCoinsIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { Fragment, type ReactNode, useState } from 'react'
import { type PayrollRow, usePayroll } from '@/entities/payroll'
import { useHasPermission } from '@/entities/session'
import { PayoutsDialog, RecalculateDialog } from '@/features/payroll-manage'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Money,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { WorksTable } from './WorksTable'

const thisMonth = () => todayISO().slice(0, 7)

/// Foizli xodimning ulushi noldan farq qilishi kutiladi; nol boʻlsa tashrif
/// foiz qoʻyilishidan oldin yozilgan — «Qayta hisoblash» kerakligiga ishora
function needsRecalc(row: PayrollRow): boolean {
  return row.percent > 0 && row.visits > 0 && row.share === 0
}

export function Payroll() {
  const [month, setMonth] = useState(thisMonth)
  const { data, isPending } = usePayroll(month)
  const hasPermission = useHasPermission()
  const manage = hasPermission('payroll.manage')

  const [openRow, setOpenRow] = useState<string | null>(null)
  const [recalcRow, setRecalcRow] = useState<PayrollRow | null>(null)
  // Toʻlov oynasi qatorni id boʻyicha oladi: toʻlovdan keyin roʻyxat
  // yangilanadi va oyna yangi qoldiqni koʻrsatishi kerak
  const [payForId, setPayForId] = useState<string | null>(null)
  const payFor = data?.rows.find((row) => row.userId === payForId) ?? null

  // Shifokor faqat oʻzini koʻradi — bitta qator, ishlar roʻyxati darhol ochiq
  const own = !manage && data?.rows.length === 1 ? data.rows[0] : null

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{PAYROLL_UI.title}</h1>
          <p className="text-muted-foreground text-sm">
            {manage ? PAYROLL_UI.subtitle : PAYROLL_UI.own_subtitle}
          </p>
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

      {isPending || !data ? (
        <Skeleton className="h-48 w-full" />
      ) : own ? (
        <OwnView month={month} row={own} />
      ) : data.rows.length === 0 ? (
        <Card className="overflow-hidden py-0">
          <EmptyState icon={BanknoteIcon} text={PAYROLL_UI.empty} />
        </Card>
      ) : (
        <>
          {data.unassigned && (
            <p className="text-muted-foreground mb-3 text-sm">
              {PAYROLL_UI.unassigned(data.unassigned.visits, formatSom(data.unassigned.charges))}
            </p>
          )}

          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{PAYROLL_UI.staff}</TableHead>
                  {/* Telefonda faqat xodim va jami — qolgani ochilganda */}
                  <TableHead className="hidden w-16 text-right sm:table-cell">
                    {PAYROLL_UI.visits}
                  </TableHead>
                  <TableHead className="hidden w-32 text-right xl:table-cell">
                    {PAYROLL_UI.charges}
                  </TableHead>
                  <TableHead className="hidden w-32 text-right sm:table-cell">
                    {PAYROLL_UI.share}
                  </TableHead>
                  <TableHead className="hidden w-32 text-right md:table-cell">
                    {PAYROLL_UI.salary}
                  </TableHead>
                  <TableHead className="text-right sm:w-32">{PAYROLL_UI.total}</TableHead>
                  <TableHead className="hidden w-32 text-right xl:table-cell">
                    {PAYROLL_UI.paid}
                  </TableHead>
                  <TableHead className="hidden w-32 text-right lg:table-cell">
                    {PAYROLL_UI.remaining}
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => {
                  const opened = openRow === row.userId
                  return (
                    <Fragment key={row.userId}>
                      <TableRow
                        className={cn('cursor-pointer', row.status === 'disabled' && 'opacity-60')}
                        onClick={() => setOpenRow(opened ? null : row.userId)}
                      >
                        <TableCell className="font-medium whitespace-normal">
                          <span className="flex items-center gap-2">
                            <ChevronDownIcon
                              className={cn(
                                'text-muted-foreground size-4 transition-transform',
                                opened && 'rotate-180',
                              )}
                              aria-hidden="true"
                            />
                            <span>
                              {row.fullName}
                              {row.roleName && (
                                <span className="text-muted-foreground block text-xs font-normal">
                                  {row.roleName}
                                </span>
                              )}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                          {row.visits}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums xl:table-cell">
                          {formatSom(row.charges)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'hidden text-right tabular-nums sm:table-cell',
                            needsRecalc(row) && 'text-warn',
                          )}
                        >
                          {row.percent > 0 || row.share > 0 ? formatSom(row.share) : '—'}
                          {row.percent > 0 && (
                            <span className="text-muted-foreground block text-xs">
                              {row.percent}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums md:table-cell">
                          {row.salary > 0 ? formatSom(row.salary) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatSom(row.total)}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums xl:table-cell">
                          {row.paid > 0 ? formatSom(row.paid) : '—'}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'hidden text-right tabular-nums lg:table-cell',
                            row.remaining > 0 && row.total > 0 && 'text-warn',
                            row.remaining < 0 && 'text-destructive',
                          )}
                        >
                          {row.total > 0 || row.paid > 0 ? formatSom(row.remaining) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 data-[state=open]:bg-muted"
                                aria-label={row.fullName}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <MoreHorizontalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <DropdownMenuItem onClick={() => setPayForId(row.userId)}>
                                <HandCoinsIcon />
                                {PAYROLL_UI.pay}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setOpenRow(row.userId)}>
                                <ChevronDownIcon />
                                {PAYROLL_UI.show_works}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={row.visits === 0}
                                onClick={() => setRecalcRow(row)}
                              >
                                <RefreshCwIcon />
                                {PAYROLL_UI.recalculate}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {opened && (
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableCell colSpan={9} className="p-0">
                            <WorksTable month={month} userId={row.userId} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
                <TableRow className="bg-muted/40 font-semibold hover:bg-muted/40">
                  <TableCell>{PAYROLL_UI.totals}</TableCell>
                  <TableCell className="hidden sm:table-cell" />
                  <TableCell className="hidden text-right tabular-nums xl:table-cell">
                    {formatSom(data.totals.charges)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatSom(data.totals.share)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {formatSom(data.totals.salary)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatSom(data.totals.total)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums xl:table-cell">
                    {formatSom(data.totals.paid)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {formatSom(data.totals.total - data.totals.paid)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <p className="text-muted-foreground mt-3 text-xs">{PAYROLL_UI.no_terms_hint}</p>
        </>
      )}

      <RecalculateDialog month={month} row={recalcRow} onClose={() => setRecalcRow(null)} />
      <PayoutsDialog month={month} row={payFor} onClose={() => setPayForId(null)} />
    </>
  )
}

/// Shifokorning oʻz koʻrinishi: koʻrsatkichlar tepada, ishlar roʻyxati pastda
function OwnView({ month, row }: { month: string; row: PayrollRow }) {
  // Pul summasi telefonda yarim ustunga sigʻmaydi — butun qatorni oladi
  const money = (label: string, value: number) => ({
    label,
    value: <Money value={value} />,
    wide: true,
  })
  const stats: { label: string; value: ReactNode; wide?: boolean }[] = [
    { label: PAYROLL_UI.visits, value: String(row.visits) },
    money(PAYROLL_UI.charges, row.charges),
    money(PAYROLL_UI.share, row.share),
    ...(row.salary > 0 ? [money(PAYROLL_UI.salary, row.salary)] : []),
    money(PAYROLL_UI.total, row.total),
    ...(row.paid > 0
      ? [money(PAYROLL_UI.paid, row.paid), money(PAYROLL_UI.remaining, row.remaining)]
      : []),
  ]
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={cn(
              'min-w-0 gap-1.5 py-4 sm:gap-2 sm:py-5',
              stat.wide && 'col-span-2 sm:col-span-1',
            )}
          >
            <CardHeader>
              <CardTitle className="truncate text-xs font-medium sm:text-sm">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="truncate text-xl font-bold tabular-nums sm:text-2xl">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="gap-3 overflow-hidden pb-0">
        <CardHeader>
          <CardTitle>{PAYROLL_UI.works_title(row.fullName)}</CardTitle>
        </CardHeader>
        <WorksTable month={month} userId={null} />
      </Card>
    </>
  )
}
