import { formatMonth, formatSom, MONTHS_SHORT, REPORT_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { useState } from 'react'
import type { ReportMonth } from '@/entities/report'

/// Rang juftligi oflayn ilovadan: rang ajrata olmaydiganlar uchun ham
/// farqlanadi (sariq / yashil)
const CHARGES = 'var(--warn)'
const PAYMENTS = 'var(--ok)'

const WIDTH = 720
const HEIGHT = 240
const PAD = { top: 12, right: 8, bottom: 26, left: 62 }
const INNER_W = WIDTH - PAD.left - PAD.right
const INNER_H = HEIGHT - PAD.top - PAD.bottom

/// Oʻq belgilari: «3,5 mln», «700 ming»
function short(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1).replace('.', ',')} mln`
  }
  if (value >= 1000) return `${Math.round(value / 1000)} ming`
  return String(value)
}

/// Eng katta qiymatni yuqoriga qarab yaxlitlaydi — oʻq belgilari butun chiqsin
function axisMax(months: ReportMonth[]): number {
  const top = Math.max(1, ...months.flatMap((row) => [row.charges, row.payments]))
  const step = 10 ** Math.floor(Math.log10(top))
  return Math.ceil(top / step) * step
}

interface MonthsChartProps {
  months: ReportMonth[]
  selected: string
  onPick(month: string): void
}

export function MonthsChart({ months, selected, onPick }: MonthsChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const max = axisMax(months)
  const group = INNER_W / months.length
  const barW = Math.min(15, (group - 10) / 2)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((part) => part * max)

  function barHeight(value: number): number {
    return (value / max) * INNER_H
  }

  const tip = hovered === null ? null : months[hovered]

  return (
    <div className="relative">
      <div className="text-muted-foreground mb-2 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: CHARGES }} />
          {REPORT_UI.charges}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: PAYMENTS }} />
          {REPORT_UI.payments}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block w-full"
        role="img"
        aria-label={REPORT_UI.last_months}
      >
        {ticks.map((tick) => {
          const y = PAD.top + INNER_H - barHeight(tick)
          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--muted-foreground)"
              >
                {short(tick)}
              </text>
            </g>
          )
        })}

        {months.map((row, index) => {
          const left = PAD.left + index * group
          const center = left + group / 2
          const month = Number(row.month.slice(5, 7))
          const isSelected = row.month === selected

          return (
            // biome-ignore lint/a11y/useSemanticElements: SVG ichida <button> boʻlmaydi
            <g
              key={row.month}
              role="button"
              tabIndex={0}
              aria-label={formatMonth(row.month)}
              className="cursor-pointer focus-visible:outline-none"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              onClick={() => onPick(row.month)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onPick(row.month)
                }
              }}
            >
              {(isSelected || hovered === index) && (
                <rect
                  x={left + 1}
                  y={PAD.top}
                  width={group - 2}
                  height={INNER_H}
                  rx="6"
                  fill="currentColor"
                  className={isSelected ? 'text-primary/12' : 'text-foreground/5'}
                />
              )}
              <rect x={left} y={PAD.top} width={group} height={INNER_H} fill="transparent" />
              <rect
                x={center - barW - 1}
                y={PAD.top + INNER_H - barHeight(row.charges)}
                width={barW}
                height={barHeight(row.charges)}
                rx="3"
                fill={CHARGES}
              />
              <rect
                x={center + 1}
                y={PAD.top + INNER_H - barHeight(row.payments)}
                width={barW}
                height={barHeight(row.payments)}
                rx="3"
                fill={PAYMENTS}
              />
              <text
                x={center}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize="11"
                fill={isSelected ? 'var(--primary)' : 'var(--muted-foreground)'}
                fontWeight={isSelected ? 700 : 400}
              >
                {MONTHS_SHORT[month - 1]}
                {month === 1 ? ` ʼ${row.month.slice(2, 4)}` : ''}
              </text>
            </g>
          )
        })}
      </svg>

      {tip && (
        <div
          className={cn(
            'bg-popover text-popover-foreground pointer-events-none absolute top-8 z-10',
            'rounded-md border px-2.5 py-1.5 text-xs shadow-md',
          )}
          style={{
            left: `${((PAD.left + (hovered as number) * group + group / 2) / WIDTH) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold">{formatMonth(tip.month)}</div>
          <div className="mt-0.5 whitespace-nowrap">
            {REPORT_UI.charges}: {formatSom(tip.charges)}
          </div>
          <div className="whitespace-nowrap">
            {REPORT_UI.payments}: {formatSom(tip.payments)}
          </div>
        </div>
      )}

      <p className="text-muted-foreground mt-1 text-xs">{REPORT_UI.chart_hint}</p>
    </div>
  )
}
