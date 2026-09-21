import { formatMoney, formatSom, PAYROLL_UI, todayISO } from '@e-dentist/shared'
import { BanknoteIcon } from 'lucide-react'
import { useState } from 'react'
import { type PayrollRow, usePayroll } from '@/entities/payroll'
import { useHasPermission } from '@/entities/session'
import {
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  EmptyState,
  MonthNav,
  Skeleton,
} from '@/shared/ui'
import { CashFlow } from './CashFlow'
import { StaffPanel } from './StaffPanel'
import { StaffRow } from './StaffRow'

const thisMonth = () => todayISO().slice(0, 7)

function Section({
  title,
  rows,
  onOpen,
}: {
  title: string
  rows: PayrollRow[]
  onOpen: (row: PayrollRow) => void
}) {
  if (rows.length === 0) return null
  const remaining = rows.reduce((acc, row) => acc + Math.max(0, row.remaining), 0)
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1 text-xs font-semibold">
        <span className="text-muted-foreground uppercase">{title}</span>
        {remaining > 0 && (
          <span>
            {PAYROLL_UI.remaining_short} {formatMoney(String(remaining))}
          </span>
        )}
      </div>
      <Card className="divide-y overflow-hidden py-0">
        {rows.map((row) => (
          <StaffRow key={row.userId} row={row} onOpen={() => onOpen(row)} />
        ))}
      </Card>
    </section>
  )
}

/// Ish haqi: kassa taqsimoti (egasiga) → foizdagilar / oylikdagilar roʻyxati
/// → xodim bosilsa varaq (Hisob · Ishlar · Toʻlovlar). Shifokor (payroll.own)
/// faqat oʻz varagʻini koʻradi — sahifaning oʻzida
export function Payroll() {
  const [month, setMonth] = useState(thisMonth)
  const { data, isPending } = usePayroll(month)
  const manage = useHasPermission()('payroll.manage')
  // Varaq qatorni id boʻyicha oladi: toʻlovdan keyin roʻyxat yangilanadi va
  // varaq yangi qoldiqni koʻrsatishi kerak
  const [openId, setOpenId] = useState<string | null>(null)
  const opened = data?.rows.find((row) => row.userId === openId) ?? null
  const own = !manage && data?.rows.length === 1 ? data.rows[0] : null

  const byPercent = (data?.rows ?? []).filter((row) => row.percent > 0 || row.visits > 0)
  const bySalary = (data?.rows ?? []).filter((row) => !byPercent.includes(row))

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{PAYROLL_UI.title}</h1>
          <p className="text-muted-foreground text-sm">
            {manage ? PAYROLL_UI.subtitle : PAYROLL_UI.own_subtitle}
          </p>
        </div>
        <MonthNav month={month} onChange={setMonth} />
      </div>

      {isPending || !data ? (
        <Skeleton className="h-48 w-full" />
      ) : own ? (
        <Card className="px-4 py-4">
          <StaffPanel month={month} row={own} manage={false} ownUserId />
        </Card>
      ) : data.rows.length === 0 ? (
        <Card className="overflow-hidden py-0">
          <EmptyState icon={BanknoteIcon} text={PAYROLL_UI.empty} />
        </Card>
      ) : (
        <div className="space-y-4">
          {manage && <CashFlow totals={data.totals} />}
          {data.unassigned && (
            <p className="text-muted-foreground text-xs">
              {PAYROLL_UI.unassigned(data.unassigned.visits, formatSom(data.unassigned.charges))}
            </p>
          )}
          <Section
            title={PAYROLL_UI.section_percent}
            rows={byPercent}
            onOpen={(row) => setOpenId(row.userId)}
          />
          <Section
            title={PAYROLL_UI.section_salary}
            rows={bySalary}
            onOpen={(row) => setOpenId(row.userId)}
          />
          <p className="text-muted-foreground text-xs">{PAYROLL_UI.no_terms_hint}</p>
        </div>
      )}

      <Dialog open={opened !== null} onOpenChange={(next) => !next && setOpenId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="sr-only">{opened?.fullName}</DialogTitle>
          {opened && <StaffPanel month={month} row={opened} manage={manage} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
