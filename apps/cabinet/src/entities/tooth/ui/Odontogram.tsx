import { CHART_UI } from '@e-dentist/shared'
import {
  bridgeSpan,
  crownMaterialLabel,
  MATERIAL_COLOR,
  type PlacedTooth,
  placeArch,
  STATUS_STYLE,
} from '@e-dentist/teeth'
import type { BridgeInfo, ToothInfo } from '../model'
import { ARCHES, CHART } from './shapes'
import { ToothShape } from './ToothShape'

// Ravoq geometriyasi oʻzgarmas — modul yuklanganda bir marta hisoblanadi
const PERMANENT = [...placeArch(ARCHES.upper), ...placeArch(ARCHES.lower)]
const PRIMARY = [...placeArch(ARCHES.primaryUpper), ...placeArch(ARCHES.primaryLower)]

/// Koʻprik chizigʻi: tishlarning tashqi chetidan, raqamlardan oldin oʻtadi
function bridgePath(span: readonly number[], placed: Map<number, PlacedTooth>): string | null {
  const points = span
    .map((no) => placed.get(no))
    .filter((p): p is PlacedTooth => p !== undefined)
    .map((p) => {
      const off = p.depth / 2 + 5
      return `${(p.x + p.nx * off).toFixed(1)} ${(p.y + p.ny * off).toFixed(1)}`
    })
  if (points.length < 2) return null
  return points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point}`).join(' ')
}

interface OdontogramProps {
  byTooth: Map<number, ToothInfo>
  showPrimary: boolean
  bridges: readonly BridgeInfo[]
  highlight: readonly number[]
  selected: number | null
  onPick?: ((tooth: number) => void) | undefined
}

export function Odontogram({
  byTooth,
  showPrimary,
  bridges,
  highlight,
  selected,
  onPick,
}: OdontogramProps) {
  const teeth = showPrimary ? [...PERMANENT, ...PRIMARY] : PERMANENT
  const placed = new Map(teeth.map((p) => [p.tooth, p]))

  return (
    <svg
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      className="block w-full"
      role="img"
      aria-label={CHART_UI.chart_label}
    >
      <title>{CHART_UI.chart_label}</title>
      {/* Oʻrta chiziq sut tishlari ravogʻiga yetmaydi — kesuvchilar orasidan oʻtmasin */}
      <line x1={CHART.cx} y1="200" x2={CHART.cx} y2="420" stroke="var(--border)" />
      <line x1="95" y1={CHART.middle} x2="325" y2={CHART.middle} stroke="var(--border)" />

      {teeth.map((place) => (
        <ToothShape
          key={place.tooth}
          place={place}
          info={byTooth.get(place.tooth)}
          numbersInside={place.tooth > 50}
          selected={selected === place.tooth}
          highlighted={highlight.includes(place.tooth)}
          onClick={onPick ? () => onPick(place.tooth) : undefined}
        />
      ))}

      {bridges.map((bridge) => {
        const span =
          bridge.teeth.length >= 2
            ? bridge.teeth
            : bridgeSpan(bridge.teeth[0] ?? 0, bridge.teeth[0] ?? 0)
        const d = bridgePath(span, placed)
        if (!d) return null
        const color =
          MATERIAL_COLOR[(bridge.material ?? '') as keyof typeof MATERIAL_COLOR] ??
          STATUS_STYLE.koprik.stroke
        return (
          <path
            key={bridge.id}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>{CHART_UI.bridge_title(span, crownMaterialLabel(bridge.material))}</title>
          </path>
        )
      })}
    </svg>
  )
}
