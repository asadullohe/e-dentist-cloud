import { formatDate, formatMoney, formatSom, PAYMENT_UI, PAYROLL_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { Link } from 'react-router-dom'
import { usePayrollVisits } from '@/entities/payroll'
import { useHasPermission } from '@/entities/session'
import { Skeleton } from '@/shared/ui'

/// Xodimning oydagi ishlari: muolaja · tish · narx; ostida sana, bemor,
/// texnik narxi, olingan/qarz belgisi va ulush. Shifokor nimadan qancha
/// topganini koʻradi — hisob «qora quti» boʻlmasin
export function WorksList({ month, userId }: { month: string; userId: string | null }) {
  const { data, isPending } = usePayrollVisits(month, userId, true)
  const canOpenPatient = useHasPermission()('patients.read')

  if (isPending) return <Skeleton className="h-24 w-full" />
  if (!data || data.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">{PAYROLL_UI.works_empty}</p>
    )
  }

  return (
    <ul className="divide-y">
      {data.map((row) => {
        const full = row.unpaid <= 0
        return (
          <li key={row.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 py-2.5 text-xs">
            <span className="text-sm font-semibold">
              {row.treatment}
              {row.tooth !== null && <span className="text-muted-foreground"> · {row.tooth}</span>}
            </span>
            <span className="text-right text-sm font-semibold tabular-nums">
              {formatSom(row.price)}
            </span>
            <span className="text-muted-foreground min-w-0 truncate">
              {formatDate(row.date.slice(0, 10))} ·{' '}
              {canOpenPatient ? (
                <Link to={`/patients/${row.patientId}`} className="hover:underline">
                  {row.patientName}
                </Link>
              ) : (
                row.patientName
              )}
              {row.labCost > 0 && ` · ${PAYROLL_UI.lab_cost} −${formatMoney(String(row.labCost))}`}
            </span>
            <span className="text-muted-foreground text-right whitespace-nowrap tabular-nums">
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  full ? 'bg-ok/15 text-ok' : 'bg-destructive/10 text-destructive',
                )}
              >
                {full ? PAYMENT_UI.paid_full : PAYROLL_UI.debt_of(formatMoney(String(row.unpaid)))}
              </span>
              {' · '}
              {PAYROLL_UI.share} {formatMoney(String(row.sharePaid))}
              {row.sharePaid !== row.share && (
                <span className="text-muted-foreground/70">
                  {' '}
                  / {formatMoney(String(row.share))}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
