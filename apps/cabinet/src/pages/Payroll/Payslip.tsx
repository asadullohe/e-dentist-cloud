import { formatSom, PAYROLL_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import type { PayrollRow } from '@/entities/payroll'

/// Foizli xodimning ulushi noldan farq qilishi kutiladi; nol boʻlsa tashrif
/// foiz qoʻyilishidan oldin yozilgan — «Qayta hisoblash» kerakligiga ishora
export const needsRecalc = (row: PayrollRow) =>
  row.percent > 0 && row.visits > 0 && row.share === 0 && row.pendingShare === 0

function Line({
  label,
  value,
  negative = false,
  muted = false,
}: {
  label: string
  value: number
  negative?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-dashed py-1.5 first:border-t-0">
      <span className={cn(muted && 'text-muted-foreground')}>{label}</span>
      <span className={cn('font-semibold tabular-nums', negative && 'text-destructive')}>
        {negative ? '− ' : ''}
        {formatSom(value)}
      </span>
    </div>
  )
}

/// Hisob varagʻi: ish summasi → − texnik → − olinmagan → ulush → oylik →
/// − toʻlab berildi → qoldiq. Har son qayerdan kelgani koʻrinsin
export function Payslip({ row }: { row: PayrollRow }) {
  const byPercent = row.percent > 0 || row.visits > 0
  return (
    <div className="text-sm">
      {byPercent && (
        <>
          <Line
            label={`${PAYROLL_UI.line_charges} · ${PAYROLL_UI.works_count(row.visits)}`}
            value={row.charges}
          />
          {row.labCost > 0 && <Line label={PAYROLL_UI.line_lab} value={row.labCost} negative />}
          {row.uncollected > 0 && (
            <Line label={PAYROLL_UI.line_uncollected} value={row.uncollected} negative />
          )}
          <Line label={PAYROLL_UI.line_share(row.percent)} value={row.share} />
          {row.pendingShare > 0 && (
            <p className="text-muted-foreground -mt-0.5 pb-1.5 pl-3 text-xs">
              {PAYROLL_UI.pending_note(formatSom(row.pendingShare))}
            </p>
          )}
          {needsRecalc(row) && (
            <p className="text-warn pb-1.5 pl-3 text-xs">{PAYROLL_UI.needs_recalc}</p>
          )}
        </>
      )}
      {(row.salary > 0 || !byPercent) && <Line label={PAYROLL_UI.line_salary} value={row.salary} />}
      <Line
        label={`${PAYROLL_UI.line_paid}${row.payouts.length ? ` · ${row.payouts.length}` : ''}`}
        value={row.paid}
        negative={row.paid > 0}
      />
      <div className="mt-1 flex items-center justify-between border-t-2 pt-2 text-base font-bold">
        <span>{PAYROLL_UI.line_remaining}</span>
        <span className={cn('tabular-nums', row.remaining < 0 && 'text-destructive')}>
          {formatSom(row.remaining)}
        </span>
      </div>
    </div>
  )
}
