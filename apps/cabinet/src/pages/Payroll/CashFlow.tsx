import { CURRENCY, formatMoney, PAYROLL_UI } from '@e-dentist/shared'
import type { Payroll } from '@/entities/payroll'
import { Card } from '@/shared/ui'

/// Kassa taqsimoti: bemorlardan olingan pul qayerga ketadi — shifokorlar
/// ulushi, texniklar, oyliklar, klinikaga qolgan. Faqat egasiga
export function CashFlow({ totals }: { totals: Payroll['totals'] }) {
  const parts = [
    { key: 'doctors', label: PAYROLL_UI.flow_doctors, value: totals.share, color: 'bg-primary' },
    { key: 'techs', label: PAYROLL_UI.flow_techs, value: totals.labCost, color: 'bg-info' },
    { key: 'salaries', label: PAYROLL_UI.flow_salaries, value: totals.salary, color: 'bg-warn' },
    { key: 'clinic', label: PAYROLL_UI.flow_clinic, value: totals.clinic, color: 'bg-ok' },
  ]
  // Chiziq faqat musbat boʻlaklardan (oyliklar olingandan oshsa «klinikaga»
  // manfiy — chiziqda yoʻq, sonda koʻrinadi)
  const positive = parts.filter((part) => part.value > 0)
  const sum = positive.reduce((acc, part) => acc + part.value, 0)

  return (
    <Card className="gap-3 px-4 py-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-muted-foreground text-xs">
            {PAYROLL_UI.cash_collected} · {CURRENCY}
          </div>
          <div className="text-2xl font-bold tabular-nums">
            {formatMoney(String(totals.collected))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground text-xs">{PAYROLL_UI.cash_uncollected}</div>
          <div className="text-destructive font-semibold tabular-nums">
            {formatMoney(String(totals.uncollected))}
          </div>
        </div>
      </div>
      {sum > 0 && (
        <div className="bg-muted flex h-3 overflow-hidden rounded-full">
          {positive.map((part) => (
            <span
              key={part.key}
              className={part.color}
              style={{ width: `${(part.value / sum) * 100}%` }}
              title={`${part.label}: ${formatMoney(String(part.value))}`}
            />
          ))}
        </div>
      )}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {parts.map((part) => (
          <div key={part.key} className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-sm ${part.color}`} aria-hidden="true" />
              {part.label}
            </dt>
            <dd
              className={`font-semibold tabular-nums ${part.value < 0 ? 'text-destructive' : ''}`}
            >
              {formatMoney(String(part.value))}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
