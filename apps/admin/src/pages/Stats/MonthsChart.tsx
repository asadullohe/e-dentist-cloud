import { ADMIN_UI, formatMonth } from '@e-dentist/shared'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'

interface Row {
  month: string
  registered: number
  extended: number
}

/// Ranglar `--chart-1` va `--chart-2` dan olinadi: tungi rejimda ular
/// oʻzi almashadi, komponentga hech narsa qilish kerak emas
const SERIES = [
  { key: 'registered', label: ADMIN_UI.registered_month, color: 'var(--chart-1)' },
  { key: 'extended', label: ADMIN_UI.extended_month, color: 'var(--chart-2)' },
] as const

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <div className="mb-1 text-xs font-medium">{label}</div>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <span
            className="size-2 rounded-full"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">
            {SERIES.find((s) => s.key === item.name)?.label ?? item.name}
          </span>
          <span className="ml-auto font-medium tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export function MonthsChart({ months }: { months: Row[] }) {
  const data = months.map((row) => ({ ...row, label: formatMonth(row.month) }))

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {SERIES.map((series) => (
          <div key={series.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ background: series.color }}
              aria-hidden="true"
            />
            {series.label}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
            stroke="var(--muted-foreground)"
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={28}
            fontSize={12}
            stroke="var(--muted-foreground)"
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            content={(props) => <ChartTooltip {...props} />}
          />
          {SERIES.map((series) => (
            <Bar
              key={series.key}
              dataKey={series.key}
              fill={series.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
