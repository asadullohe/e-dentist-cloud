// Odontogramma. Oflayn ilovadagi ToothChart.jsx dan koʻchirildi.
//
// Bu komponent faqat chizadi — maʼlumotni tashqaridan oladi va bosilganini
// tashqariga xabar qiladi. Tahrirlash oynasi alohida (features/tooth-edit).

import { CHART_UI } from '@e-dentist/shared'
import {
  archLayout,
  bridgeSpan,
  crownMaterialLabel,
  isCrowned,
  isPrimary,
  LOWER,
  MATERIAL_STYLE,
  PRIMARY_LOWER,
  PRIMARY_UPPER,
  STATUS_STYLE,
  TOOTH_STATUSES,
  type ToothStatus,
  type ToothType,
  TYPE_SCALE,
  toothStatusLabel,
  toothType,
  UPPER,
} from '@e-dentist/teeth'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/ui'
import type { BridgeInfo, ToothInfo } from '../model'
import { type ArchConfig, GROOVES, MARGIN_X, PERMANENT_ARCH, PRIMARY_ARCH, SHAPES } from './shapes'

/// Ikkala xarita ham bir xil gradientlardan foydalanadi — bir marta eʼlon
function Defs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <title>Gradientlar</title>
      <defs>
        {Object.entries(STATUS_STYLE).map(([key, style]) => (
          <linearGradient key={key} id={`tg-${key}`} x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0" stopColor={style.grad[0]} />
            <stop offset="1" stopColor={style.grad[1]} />
          </linearGradient>
        ))}
        {Object.entries(MATERIAL_STYLE).map(([key, style]) => (
          <linearGradient key={key} id={`mg-${key || 'none'}`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor={style.grad[0]} />
            <stop offset="1" stopColor={style.grad[1]} />
          </linearGradient>
        ))}
        {/* Koronka faqat tojni qoplaydi — ildiz ochiq qoladi */}
        <clipPath id="crown-clip">
          <rect x="-30" y="-48" width="60" height="47" />
        </clipPath>
        <filter id="tshadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            dx="0"
            dy="2.5"
            stdDeviation="2.6"
            floodColor="#22312f"
            floodOpacity="0.22"
          />
        </filter>
      </defs>
    </svg>
  )
}

/// Toj ustidagi qopqoq: silueт tojgacha qirqiladi va material rangi bilan boʻyaladi
function CrownCap({
  type,
  material,
  pontic,
}: {
  type: ToothType
  material: string | null | undefined
  pontic: boolean
}) {
  const style =
    MATERIAL_STYLE[(material ?? '') as keyof typeof MATERIAL_STYLE] ?? MATERIAL_STYLE['']
  const marginX = MARGIN_X[type]

  return (
    <g clipPath="url(#crown-clip)">
      <g transform="scale(1.07 1.03)">
        <path
          d={SHAPES[type]}
          fill={`url(#mg-${material || 'none'})`}
          stroke={style.stroke}
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />
        <ellipse
          cx="-5"
          cy="-24"
          rx="4.5"
          ry="7"
          fill="#fff"
          opacity="0.55"
          transform="rotate(-18 -5 -24)"
        />
      </g>
      {/* Qopqoq chekkasi. Quyma tishda uzuq chiziq — ostida tabiiy tish yoʻq */}
      <line
        x1={-marginX}
        y1="-1.5"
        x2={marginX}
        y2="-1.5"
        stroke={style.stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={pontic ? '3 3' : undefined}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  )
}

interface ToothProps {
  no: number
  info: ToothInfo | undefined
  upper: boolean
  x: number
  y: number
  rot: number
  scale: number
  onClick?: (() => void) | undefined
}

function Tooth({ no, info, upper, x, y, rot, scale, onClick }: ToothProps) {
  const status = (info?.status ?? 'soglom') as ToothStatus
  const type = toothType(no)
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.soglom
  const removed = status === 'olingan'
  const crowned = isCrowned(status)
  /// Quyma tish: tabiiy tish yoʻq, faqat toj turibdi
  const pontic = status === 'koprik'

  // Raqam yorligʻi ildiz tomonda: (0, off) vektorini tish burilishi boʻyicha aylantiramiz
  const rad = (rot * Math.PI) / 180
  const off = (upper ? -58 : 60) * scale
  const labelX = x - off * Math.sin(rad)
  const labelY = y + off * Math.cos(rad)

  const title = [
    `${no} — ${toothStatusLabel(status)}`,
    crowned && info?.material ? crownMaterialLabel(info.material) : '',
    info?.note ?? '',
  ]
    .filter(Boolean)
    .join(' · ')

  const groove = GROOVES[type]

  const visual = (
    <>
      <title>{title}</title>
      <g transform={`scale(${TYPE_SCALE[type] * 0.95 * scale} ${(upper ? -0.95 : 0.95) * scale})`}>
        {/* Quyma tishda tabiiy tish chizilmaydi. Koronka ostida esa tish
            turibdi, shuning uchun u oddiy rangda qoladi */}
        {!pontic && (
          <path
            d={SHAPES[type]}
            fill={`url(#tg-${crowned ? 'soglom' : status})`}
            stroke={crowned ? STATUS_STYLE.soglom.stroke : style.stroke}
            strokeWidth={removed ? 1.4 : 1.1}
            strokeDasharray={removed ? '4 3' : undefined}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {groove && !removed && !crowned && (
          <path
            d={groove}
            fill="none"
            stroke="rgba(60,50,20,0.16)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
        {!removed && !crowned && (
          <ellipse
            cx="-5"
            cy="-24"
            rx="4.5"
            ry="7"
            fill="#fff"
            opacity="0.5"
            transform="rotate(-18 -5 -24)"
          />
        )}
        {removed && (
          <path
            d="M -9 -30 L 9 -12 M 9 -30 L -9 -12"
            stroke={style.stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
        {crowned && <CrownCap type={type} material={info?.material} pontic={pontic} />}
      </g>
      {/* Izoh belgisi */}
      {info?.note && (
        <circle
          cx={10}
          cy={upper ? 30 : -30}
          r="4"
          fill="var(--brand-accent)"
          stroke="#fff"
          strokeWidth="1.4"
        />
      )}
    </>
  )

  const opacity = removed ? 0.45 : 1
  const filter = removed ? undefined : 'url(#tshadow)'

  return (
    <g>
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        {onClick ? (
          // Tish tugma sifatida ishlaydi: sichqoncha bilan ham, klaviatura
          // bilan ham ochiladi. <button> SVG ichida yaroqli element emas,
          // shuning uchun role="button" — bu standart yechim
          // biome-ignore lint/a11y/useSemanticElements: SVG da <button> ishlatib boʻlmaydi
          <g
            role="button"
            tabIndex={0}
            aria-label={title}
            className="focus-visible:outline-ring cursor-pointer transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={onClick}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }}
            opacity={opacity}
            filter={filter}
          >
            {visual}
          </g>
        ) : (
          <g opacity={opacity} filter={filter}>
            {visual}
          </g>
        )}
      </g>
      <text
        x={labelX}
        y={labelY + 4}
        textAnchor="middle"
        fontSize={11.5 * scale}
        fontWeight="700"
        fill={status === 'soglom' ? 'var(--muted-foreground)' : style.stroke}
        className="pointer-events-none [font-variant-numeric:tabular-nums]"
      >
        {no}
      </text>
    </g>
  )
}

interface Position {
  x: number
  y: number
  rot: number
  upper: boolean
}

/// Ravoq boʻylab joylashuv: t 0..1 → x, y, burilish
function archPos(t: number, upper: boolean, cfg: ArchConfig): Omit<Position, 'upper'> {
  const spread = 0.5 + (t - 0.5) * cfg.spread
  const lift = cfg.lift * Math.sin(Math.PI * t)
  return {
    x: 64 + 632 * spread,
    y: upper ? cfg.top - lift : cfg.bottom + lift,
    rot: (upper ? 0.5 - t : t - 0.5) * cfg.tilt,
  }
}

/// Koʻprik yoʻlagi: tishlarning milk chizigʻi darajasidagi nuqtalarini bogʻlaydi
function bridgePath(
  span: readonly number[],
  positions: Map<number, Position>,
  cfg: ArchConfig,
): string | null {
  const points = span
    .map((no) => positions.get(no))
    .filter((p): p is Position => p !== undefined)
    .map((p) => {
      const rad = (p.rot * Math.PI) / 180
      const off = (p.upper ? 7 : -7) * cfg.scale
      return [p.x - off * Math.sin(rad), p.y + off * Math.cos(rad)] as const
    })

  if (points.length < 2) return null
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
}

interface OdontogramProps {
  upper: readonly number[]
  lower: readonly number[]
  byTooth: Map<number, ToothInfo>
  cfg: ArchConfig
  bridges?: BridgeInfo[]
  onPick?: ((tooth: number) => void) | undefined
}

function Odontogram({ upper, lower, byTooth, cfg, bridges = [], onPick }: OdontogramProps) {
  const positions = new Map<number, Position>()
  for (const [list, isUpper] of [
    [upper, true],
    [lower, false],
  ] as const) {
    const layout = archLayout(list)
    list.forEach((no, index) => {
      positions.set(no, { ...archPos(layout[index] ?? 0, isUpper, cfg), upper: isUpper })
    })
  }

  return (
    <svg
      viewBox={`0 0 760 ${cfg.height}`}
      className="mx-auto block w-full"
      style={{ maxWidth: cfg.maxWidth }}
      role="img"
      aria-label={CHART_UI.chart_label}
    >
      <title>{CHART_UI.chart_label}</title>
      <text
        x="380"
        y={cfg.middle - 10}
        textAnchor="middle"
        fontSize="12"
        fill="var(--muted-foreground)"
      >
        {CHART_UI.upper_jaw}
      </text>
      <line
        x1="140"
        y1={cfg.middle}
        x2="620"
        y2={cfg.middle}
        stroke="var(--border)"
        strokeDasharray="3 5"
      />
      <text
        x="380"
        y={cfg.middle + 22}
        textAnchor="middle"
        fontSize="12"
        fill="var(--muted-foreground)"
      >
        {CHART_UI.lower_jaw}
      </text>

      {/* Koʻpriklar tishlar ostida — chetlari koʻrinib turadi */}
      {bridges.map((bridge) => {
        const span =
          bridge.teeth.length >= 2
            ? bridge.teeth
            : bridgeSpan(bridge.teeth[0] ?? 0, bridge.teeth[0] ?? 0)
        const d = bridgePath(span, positions, cfg)
        if (!d) return null
        const style =
          MATERIAL_STYLE[(bridge.material ?? '') as keyof typeof MATERIAL_STYLE] ??
          MATERIAL_STYLE['']
        return (
          <path
            key={bridge.id}
            d={d}
            fill="none"
            stroke={style.stroke}
            strokeWidth={11 * cfg.scale}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          >
            <title>{CHART_UI.bridge_title(span, crownMaterialLabel(bridge.material))}</title>
          </path>
        )
      })}

      {[...upper, ...lower].map((no) => {
        const p = positions.get(no)
        if (!p) return null
        return (
          <Tooth
            key={no}
            no={no}
            info={byTooth.get(no)}
            upper={p.upper}
            x={p.x}
            y={p.y}
            rot={p.rot}
            scale={cfg.scale}
            onClick={onPick ? () => onPick(no) : undefined}
          />
        )
      })}
    </svg>
  )
}

export interface ToothChartProps {
  teeth: ToothInfo[]
  bridges?: BridgeInfo[]
  onPick?: ((tooth: number) => void) | undefined
}

export function ToothChart({ teeth, bridges = [], onPick }: ToothChartProps) {
  const byTooth = new Map(teeth.map((t) => [t.tooth, t]))
  // Bemorda sut tishi belgilangan boʻlsa — pastki xarita oʻzi ochiladi
  const [showPrimary, setShowPrimary] = useState(() => teeth.some((t) => isPrimary(t.tooth)))

  return (
    <div>
      <Defs />
      <Odontogram
        upper={UPPER}
        lower={LOWER}
        byTooth={byTooth}
        cfg={PERMANENT_ARCH}
        bridges={bridges}
        onPick={onPick}
      />

      <div className="my-2 flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => setShowPrimary(!showPrimary)}>
          {showPrimary ? <ChevronDownIcon /> : <ChevronRightIcon />}
          {CHART_UI.primary_teeth}
        </Button>
      </div>

      {showPrimary && (
        <Odontogram
          upper={PRIMARY_UPPER}
          lower={PRIMARY_LOWER}
          byTooth={byTooth}
          cfg={PRIMARY_ARCH}
          onPick={onPick}
        />
      )}

      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
        {TOOTH_STATUSES.map((status) => {
          const style = STATUS_STYLE[status]
          return (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className="inline-block size-3 rounded-sm border"
                style={{
                  background: `linear-gradient(160deg, ${style.grad[0]}, ${style.grad[1]})`,
                  borderColor: style.stroke,
                }}
              />
              {toothStatusLabel(status)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
