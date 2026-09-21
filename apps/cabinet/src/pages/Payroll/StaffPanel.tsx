import { formatMoney, formatMonth, PAYROLL_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { HandCoinsIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import type { PayrollRow } from '@/entities/payroll'
import { PayoutsPanel, RecalculateDialog } from '@/features/payroll-manage'
import { Button } from '@/shared/ui'
import { Payslip } from './Payslip'
import { initialsOf } from './StaffRow'
import { WorksList } from './WorksList'

type Tab = 'statement' | 'works' | 'payouts'

/// Xodim varagʻi: sarlavha (ism, rol · foiz · oy, qoldiq), uch boʻlim —
/// Hisob · Ishlar · Toʻlovlar, pastda «Qayta hisoblash · Toʻlash» (egasiga).
/// Telefonda pastdan varaqda, shifokorga (payroll.own) sahifaning oʻzida
export function StaffPanel({
  month,
  row,
  manage,
  ownUserId,
}: {
  month: string
  row: PayrollRow
  manage: boolean
  /// payroll.own: ishlar roʻyxati userId siz soʻraladi
  ownUserId?: boolean
}) {
  const [tab, setTab] = useState<Tab>('statement')
  const [payFocus, setPayFocus] = useState(false)
  const [recalc, setRecalc] = useState(false)
  const meta = [row.roleName, row.percent > 0 ? `${row.percent} %` : null, formatMonth(month)]
    .filter(Boolean)
    .join(' · ')

  const tabs: [Tab, string][] = [
    ['statement', PAYROLL_UI.tab_statement],
    ['works', `${PAYROLL_UI.tab_works}${row.visits ? ` ${row.visits}` : ''}`],
    ...(manage
      ? [
          [
            'payouts',
            `${PAYROLL_UI.tab_payouts}${row.payouts.length ? ` ${row.payouts.length}` : ''}`,
          ] as [Tab, string],
        ]
      : []),
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          {initialsOf(row.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-bold">{row.fullName}</div>
          <div className="text-muted-foreground truncate text-xs">{meta}</div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
            row.remaining > 0 ? 'bg-warn/20 text-foreground' : 'bg-ok/15 text-ok',
          )}
        >
          {row.remaining > 0
            ? `${PAYROLL_UI.line_remaining} ${formatMoney(String(row.remaining))}`
            : PAYROLL_UI.paid_up}
        </span>
      </div>

      <div className="bg-muted flex rounded-md p-0.5">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 rounded px-2 py-1.5 text-sm transition-colors',
              tab === key ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'statement' && <Payslip row={row} />}
      {tab === 'works' && <WorksList month={month} userId={ownUserId ? null : row.userId} />}
      {tab === 'payouts' && manage && <PayoutsPanel month={month} row={row} autoFocus={payFocus} />}

      {manage && tab !== 'payouts' && (
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            disabled={row.visits === 0}
            onClick={() => setRecalc(true)}
          >
            <RefreshCwIcon />
            {PAYROLL_UI.recalculate}
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              setPayFocus(true)
              setTab('payouts')
            }}
          >
            <HandCoinsIcon />
            {PAYROLL_UI.pay}
          </Button>
        </div>
      )}

      <RecalculateDialog month={month} row={recalc ? row : null} onClose={() => setRecalc(false)} />
    </div>
  )
}
