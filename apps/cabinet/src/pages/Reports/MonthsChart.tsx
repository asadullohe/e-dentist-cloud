import { formatMonth, formatSom, MONTHS_SHORT, REPORT_UI } from '@e-dentist/shared'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReportMonth } from '@/entities/report'

/// Ranglar `--chart-1` va `--chart-2` dan: tungi rejimda oʻzi almashadi.
/// Funksiya — nomlar joriy tilda oʻqilishi uchun
const series = () =>
  [
    { key: 'charges', label: REPORT_UI.charges, color: 'var(--chart-1)' },
    { key: 'payments', label: REPORT_UI.payments, color: 'var(--chart-2)' },
  ] as const

/// Oʻq belgilari: «3,5 mln», «700 ming». Oraliq — uzilmas boʻshliq,
/// aks holda recharts belgini ikki qatorga boʻlib yuboradi
function short(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1).replace('.', ',')}\u00a0mln`
  }
  if (value >= 1000) return `${Math.round(value / 1000)}\u00a0ming`
  return String(value)
}

/// Eng katta qiymatni yuqoriga qarab yaxlitlaydi — oʻq belgilari butun
/// sonlar boʻlsin (250 000 → 300 ming, 75/150/225/300)
function axisMax(months: ReportMonth[]): number {
  const top = Math.max(1, ...months.flatMap((row) => [row.charges, row.payments]))
  const step = 10 ** Math.floor(Math.log10(top))
  return Math.ceil(top / step) * step
}

/// Oʻq ostidagi qisqa nom: «sen», yanvarda yil bilan «yan ʼ26»
function tick(month: string): string {
  const index = Number(month.slice(5, 7)) - 1
  const name = MONTHS_SHORT[index] ?? month
  return index === 0 ? `${name} ʼ${month.slice(2, 4)}` : name
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const row = payload?.[0]?.payload as (ReportMonth & { label: string }) | undefined
  if (!active || !row) return null
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 shadow-md">
      <div className="mb-1 text-xs font-medium">{formatMonth(row.month)}</div>
      {series().map((item) => (
        <div key={item.key} className="flex items-center gap-2 text-xs">
          <span
            className="size-2 rounded-full"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">{item.label}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums">{formatSom(row[item.key])}</span>
        </div>
      ))}
    </div>
  )
}

interface MonthsChartProps {
  months: ReportMonth[]
  selected: string
  onPick(month: string): void
}

export function MonthsChart({ months, selected, onPick }: MonthsChartProps) {
  const data = months.map((row) => ({ ...row, label: tick(row.month) }))
  const max = axisMax(months)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((part) => part * max)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {series().map((item) => (
          <div key={item.key} className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span
              className="size-2 rounded-full"
              style={{ background: item.color }}
              aria-hidden="true"
            />
            {item.label}
          </div>
        ))}
      </div>

      {/* Ustun bosilsa oʻsha oy tanlanadi; tanlangan oy toʻq, qolganlari xira */}
      <ResponsiveContainer width="100%" height={260} className="cursor-pointer">
        <BarChart
          data={data}
          margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
          onClick={(state) => {
            // recharts indeksni son yoki matn («3») qilib beradi
            const index = Number(state?.activeIndex)
            const row = Number.isInteger(index) ? data[index] : undefined
            if (row) onPick(row.month)
          }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
            // Tor ekranda oy nomlari sigʻmasa — tekis oraliq bilan siyraklashadi
            minTickGap={16}
            stroke="var(--muted-foreground)"
          />
          <YAxis
            domain={[0, max]}
            ticks={ticks}
            tickFormatter={short}
            tickLine={false}
            axisLine={false}
            width={64}
            fontSize={12}
            stroke="var(--muted-foreground)"
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            content={(props) => <ChartTooltip {...props} />}
          />
          {series().map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              fill={item.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            >
              {data.map((row) => (
                <Cell key={row.month} fillOpacity={row.month === selected ? 1 : 0.45} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>

      <p className="text-muted-foreground mt-1 text-xs">{REPORT_UI.chart_hint}</p>
    </div>
  )
}
