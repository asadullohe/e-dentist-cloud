// Odontogramma: tishlar ustidan koʻrinishda, ravoq shaklida. Sut tishlari
// doimiy ravoq ichida, jagʻ oʻrtasidagi almashtirgich bilan ochiladi.
//
// Bu komponent faqat chizadi — maʼlumotni tashqaridan oladi va bosilganini
// tashqariga xabar qiladi. Tahrirlash paneli alohida (features/tooth-edit)
// va `aside` orqali oʻng ustunga qoʻyiladi.

import { CHART_UI } from '@e-dentist/shared'
import { isPrimary } from '@e-dentist/teeth'
import { type ReactNode, useId, useState } from 'react'
import { Switch } from '@/shared/ui'
import type { BridgeInfo, ToothInfo } from '../model'
import { ChartLegend } from './ChartLegend'
import { Odontogram } from './Odontogram'
import { CHART } from './shapes'

export interface ToothChartProps {
  teeth: ToothInfo[]
  bridges?: BridgeInfo[]
  /// Ajratib koʻrsatiladigan tishlar — davolash rejasining ochiq sahifasi
  /// shu bilan «qaysi tishlarga ish bor» ni koʻrsatadi (18-boʻlim)
  highlight?: readonly number[]
  /// Sut tishlari almashtirgichi, afsona va oʻng ustun yoʻq. Bemorga
  /// koʻrsatiladigan sahifada ular ortiqcha: u yerda tishning holati emas,
  /// rejadagi tishlar koʻrsatiladi
  bare?: boolean
  /// Tanlangan tish — hoshiya bilan ajraladi
  selected?: number | null
  /// Oʻng ustun tepasi (telefonda xarita ostida): tahrirlash paneli
  aside?: ReactNode
  onPick?: ((tooth: number) => void) | undefined
}

export function ToothChart({
  teeth,
  bridges = [],
  highlight = [],
  bare,
  selected = null,
  aside,
  onPick,
}: ToothChartProps) {
  const byTooth = new Map(teeth.map((t) => [t.tooth, t]))
  // Bemorda sut tishi belgilangan boʻlsa — ichki ravoq oʻzi ochiladi
  const [primaryOn, setPrimaryOn] = useState(() => teeth.some((t) => isPrimary(t.tooth)))
  const switchId = useId()
  const showPrimary = !bare && primaryOn
  const visible = teeth.filter((t) => showPrimary || !isPrimary(t.tooth))

  const chart = (
    <div className="relative mx-auto w-full" style={{ maxWidth: CHART.width }}>
      <Odontogram
        byTooth={byTooth}
        showPrimary={showPrimary}
        bridges={bridges}
        highlight={highlight}
        selected={selected}
        onPick={onPick}
      />
      {!bare && (
        // Jagʻ oʻrtasida — ikki ravoq orasidagi boʻsh joy. Foiz viewBox dagi
        // oʻrta chiziqdan: SVG kengligi bilan birga suriladi
        <label
          htmlFor={switchId}
          className="bg-card text-muted-foreground has-[[data-state=checked]]:text-foreground absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-2 rounded-full border py-1 pr-1.5 pl-3 text-xs whitespace-nowrap select-none"
          style={{ top: `${(CHART.middle / CHART.height) * 100}%` }}
        >
          {CHART_UI.primary_teeth}
          <Switch id={switchId} size="sm" checked={primaryOn} onCheckedChange={setPrimaryOn} />
        </label>
      )}
    </div>
  )

  if (bare) return chart

  return (
    <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
      {chart}
      <div className="space-y-4">
        {aside}
        <ChartLegend teeth={visible} />
      </div>
    </div>
  )
}
