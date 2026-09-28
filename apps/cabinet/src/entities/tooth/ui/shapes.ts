// Tishlarning ustidan (chaynov yuzasidan) koʻrinishdagi siluetlari.
// Lokal koordinatada: x — ravoq boʻylab (kenglik), y — ravoqqa tik,
// +y tashqariga (lab/lunj tomoni). Oʻlcham `placeArch` dan keladi.

import type { ArchSpec, ToothType } from '@e-dentist/teeth'

export interface ToothOutline {
  body: string
  /// Chaynov yuzasidagi egatlar
  groove: string
}

/// Burchaklari yumaloq toʻrtburchak
function rounded(w: number, d: number, r: number): string {
  const x = w / 2
  const y = d / 2
  return [
    `M${-x + r},${-y}H${x - r}Q${x},${-y} ${x},${-y + r}`,
    `V${y - r}Q${x},${y} ${x - r},${y}`,
    `H${-x + r}Q${-x},${y} ${-x},${y - r}`,
    `V${-y + r}Q${-x},${-y} ${-x + r},${-y}Z`,
  ].join('')
}

export function toothOutline(type: ToothType, w: number, d: number): ToothOutline {
  switch (type) {
    // Kesuvchi: lab tomoni keng yoy, til tomoni torayib boradi
    case 'incisor':
      return {
        body: `M${-w / 2},${d * 0.2}Q${-w / 2},${d / 2} 0,${d / 2}Q${w / 2},${d / 2} ${w / 2},${d * 0.2}Q${w * 0.38},${-d / 2} 0,${-d / 2}Q${-w * 0.38},${-d / 2} ${-w / 2},${d * 0.2}Z`,
        groove: `M${-w * 0.3},${d * 0.18}Q0,${d * 0.34} ${w * 0.3},${d * 0.18}`,
      }
    // Qoziq: romb shakli, uchi bitta
    case 'canine':
      return {
        body: `M0,${d / 2}Q${w / 2},${d / 2} ${w / 2},0Q${w / 2},${-d / 2} 0,${-d / 2}Q${-w / 2},${-d / 2} ${-w / 2},0Q${-w / 2},${d / 2} 0,${d / 2}Z`,
        groove: `M${-w * 0.28},${d * 0.02}L0,${d * 0.2}L${w * 0.28},${d * 0.02}`,
      }
    // Kichik oziq: oval, oʻrtasida bitta egat
    case 'premolar':
      return {
        body: rounded(w, d, Math.min(w, d) * 0.45),
        groove: `M0,${-d * 0.26}Q${w * 0.1},0 0,${d * 0.26}`,
      }
    // Katta oziq: toʻrt doʻngli, Y shaklidagi egatlar
    case 'molar':
      return {
        body: rounded(w, d, Math.min(w, d) * 0.36),
        groove: `M${w * 0.02},${-d * 0.32}L${-w * 0.06},${-d * 0.04}L${w * 0.04},${d * 0.32}M${-w * 0.06},${-d * 0.04}L${-w * 0.3},${-d * 0.1}M${w * 0.01},${d * 0.08}L${w * 0.3},${d * 0.14}`,
      }
  }
}

/// Xarita oʻlchami (viewBox) va oʻrta chiziqlar
export const CHART = { width: 420, height: 610, cx: 210, middle: 310 } as const

const base = { cx: CHART.cx, primary: false, maxScale: 9 }

/// Doimiy tishlar — tashqi ravoq; sut tishlari — uning ichida, kichikroq.
/// Ichki ravoqda tishlar kattalashmaydi (`maxScale: 1`), raqamlar ichkariga
export const ARCHES = {
  upper: { ...base, upper: true, center: 285, a: 128, b: 215 },
  lower: { ...base, upper: false, center: 335, a: 118, b: 205 },
  primaryUpper: { ...base, upper: true, primary: true, center: 278, a: 80, b: 132, maxScale: 1 },
  primaryLower: { ...base, upper: false, primary: true, center: 342, a: 74, b: 122, maxScale: 1 },
} as const satisfies Record<string, ArchSpec>
