import {
  crownMaterialLabel,
  isCrowned,
  MATERIAL_COLOR,
  type PlacedTooth,
  STATUS_STYLE,
  type ToothStatus,
  toothStatusLabel,
} from '@e-dentist/teeth'
import { cn } from 'cn'
import type { ToothInfo } from '../model'
import { toothOutline } from './shapes'

interface ToothShapeProps {
  place: PlacedTooth
  info: ToothInfo | undefined
  /// Raqam ravoqning ichki tomoniga yoziladi (sut tishlari ravogʻi)
  numbersInside: boolean
  selected: boolean
  /// Davolash rejasidagi tish — ostida halqa
  highlighted: boolean
  onClick?: (() => void) | undefined
}

/// Bitta tish: siluet, egatlar, koronka materiali halqasi, izoh nuqtasi va raqam
export function ToothShape({
  place,
  info,
  numbersInside,
  selected,
  highlighted,
  onClick,
}: ToothShapeProps) {
  const status = (info?.status ?? 'soglom') as ToothStatus
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.soglom
  const removed = status === 'olingan'
  const { width: w, depth: d } = place
  const outline = toothOutline(place.type, w, d)
  const materialColor = isCrowned(status)
    ? (MATERIAL_COLOR[(info?.material ?? '') as keyof typeof MATERIAL_COLOR] ?? null)
    : null

  const title = [
    `${place.tooth} — ${toothStatusLabel(status)}`,
    materialColor ? crownMaterialLabel(info?.material) : '',
    info?.note ?? '',
  ]
    .filter(Boolean)
    .join(' · ')

  const labelOffset = (d / 2 + 13) * (numbersInside ? -1 : 1)
  // Ichki ravoqda markaziy kesuvchilar raqami oʻrta chiziqda yopishib
  // qoladi — raqamni oʻrtadan biroz chetga suramiz
  const labelX = place.x + place.nx * labelOffset + (numbersInside ? Math.sign(place.nx) * 4 : 0)
  const labelY = place.y + place.ny * labelOffset
  const marked = selected || status !== 'soglom'

  const visual = (
    <>
      <title>{title}</title>
      {/* Tanlangan yoki rejadagi tish — atrofida yumshoq hoshiya */}
      {(selected || highlighted) && (
        <path
          d={outline.body}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={8}
          strokeLinejoin="round"
          opacity={0.45}
        />
      )}
      <path
        className="tooth-body"
        d={outline.body}
        fill={style.fill}
        stroke={selected ? 'var(--primary)' : style.stroke}
        strokeWidth={selected ? 2 : place.tooth > 50 ? 1.1 : 1.3}
        strokeDasharray={removed ? '3 3' : undefined}
        opacity={removed ? 0.8 : 1}
      />
      {!removed && (
        <path
          d={outline.groove}
          fill="none"
          stroke={style.stroke}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
      )}
      {/* Koronka materiali — ichki halqa */}
      {materialColor && (
        <path
          d={outline.body}
          transform="scale(0.72)"
          fill="none"
          stroke={materialColor}
          strokeWidth="2.2"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {info?.note && (
        <circle
          cx={w / 2 - 3}
          cy={d / 2 - 3}
          r="3.5"
          fill="var(--brand-accent)"
          stroke="var(--card)"
          strokeWidth="1.2"
        />
      )}
    </>
  )

  return (
    <g>
      <g
        transform={`translate(${place.x.toFixed(1)} ${place.y.toFixed(1)}) rotate(${place.angle.toFixed(1)})`}
      >
        {onClick ? (
          // SVG ichida <button> yaroqsiz — role="button" standart yechim
          // biome-ignore lint/a11y/useSemanticElements: SVG da <button> ishlatib boʻlmaydi
          <g
            role="button"
            tabIndex={0}
            aria-label={title}
            aria-pressed={selected}
            className="cursor-pointer outline-none [&:focus-visible_.tooth-body]:[stroke-width:2.5] [&:hover_.tooth-body]:[stroke-width:2]"
            onClick={onClick}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }}
          >
            {/* Koʻrinmas bosish maydoni — telefonda kichik tishni ham barmoq bilan bosish oson */}
            <rect x={-w / 2 - 2} y={-d / 2 - 4} width={w + 4} height={d + 8} fill="transparent" />
            {visual}
          </g>
        ) : (
          visual
        )}
      </g>
      <text
        x={labelX.toFixed(1)}
        y={labelY.toFixed(1)}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={place.tooth > 50 ? 11 : 12}
        className={cn(
          'pointer-events-none tabular-nums',
          marked ? 'fill-foreground font-semibold' : 'fill-muted-foreground',
        )}
      >
        {place.tooth}
      </text>
    </g>
  )
}
