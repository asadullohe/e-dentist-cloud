// Odontogramma: FDI raqamlash, tish turlari, ravoq geometriyasi va ranglar.
// Oflayn ilovadagi src/renderer/src/lib/teeth.js dan koʻchirildi.
//
// Bu paketda oʻzbekcha matn yoʻq — koʻrinadigan nomlar
// packages/shared/strings.ts da (TOOTH_STATUS_LABELS, CROWN_MATERIAL_LABELS).

import { CROWN_MATERIAL_LABELS, TOOTH_STATUS_LABELS } from '@e-dentist/shared'

// FDI raqamlash: yuqori 18→11 | 21→28, pastki 48→41 | 31→38 (chapdan oʻngga)
export const UPPER: readonly number[] = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
]
export const LOWER: readonly number[] = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
]

// Sut tishlari: yuqori 55→51 | 61→65, pastki 85→81 | 71→75
export const PRIMARY_UPPER: readonly number[] = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
export const PRIMARY_LOWER: readonly number[] = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]

/// Sut tishida FDI birinchi raqami 5–8 boʻladi
export function isPrimary(tooth: number): boolean {
  const quadrant = Math.floor(tooth / 10)
  return quadrant >= 5 && quadrant <= 8
}

export type ToothStatus = keyof typeof TOOTH_STATUS_LABELS
export type CrownMaterial = keyof typeof CROWN_MATERIAL_LABELS

export const TOOTH_STATUSES = Object.keys(TOOTH_STATUS_LABELS) as ToothStatus[]
export const CROWN_MATERIALS = Object.keys(CROWN_MATERIAL_LABELS) as CrownMaterial[]

export function toothStatusLabel(status: string): string {
  return TOOTH_STATUS_LABELS[status as ToothStatus] ?? status
}

export function crownMaterialLabel(material: string | null | undefined): string {
  return CROWN_MATERIAL_LABELS[(material ?? '') as CrownMaterial] ?? material ?? ''
}

/// Koronka/quyma tish ustidan qopqoq chiziladigan holatlar
export const CROWNED: readonly ToothStatus[] = ['koronka', 'koprik']
export const isCrowned = (status: string): boolean => CROWNED.includes(status as ToothStatus)

export interface ToothStyle {
  fill: string
  stroke: string
  /// Shu rang ustidagi yozuv (tanlangan holat yorligʻi)
  text: string
}

/// Har holat uchun tekis rang: tish ichi, kontur va yozuv. Sogʻlom tish
/// tungi rejimda ham oq — tishning oʻz rangi
export const STATUS_STYLE: Record<ToothStatus, ToothStyle> = {
  soglom: { fill: '#fdfcf8', stroke: '#a8a79f', text: '#444441' },
  karies: { fill: '#fac775', stroke: '#ba7517', text: '#633806' },
  plomba: { fill: '#b5d4f4', stroke: '#185fa5', text: '#0c447c' },
  koronka: { fill: '#cecbf6', stroke: '#534ab7', text: '#3c3489' },
  koprik: { fill: '#afa9ec', stroke: '#3c3489', text: '#26215c' },
  implant: { fill: '#9fe1cb', stroke: '#0f6e56', text: '#085041' },
  davolanmoqda: { fill: '#f5c4b3', stroke: '#d85a30', text: '#712b13' },
  olingan: { fill: 'none', stroke: '#b4b2a9', text: '#5f5e5a' },
}

/// Koronka materiali — tish ichidagi halqa rangi. «Koʻrsatilmagan» da halqa yoʻq
export const MATERIAL_COLOR: Record<CrownMaterial, string | null> = {
  '': null,
  keramika: '#7f93a5',
  'metall-keramika': '#9a8340',
  sirkoniy: '#74839b',
  metall: '#846412',
  plastmassa: '#b0925f',
}

export type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar'

/// FDI ikkinchi raqami tish turini beradi: 1–2 kesuvchi, 3 qoziq,
/// 4–5 kichik oziq, 6–8 katta oziq. Sut tishlarida kichik oziq boʻlmaydi —
/// 4 va 5 ham katta oziq hisoblanadi
export function toothType(tooth: number): ToothType {
  const digit = tooth % 10
  if (digit <= 2) return 'incisor'
  if (digit === 3) return 'canine'
  if (isPrimary(tooth)) return 'molar'
  if (digit <= 5) return 'premolar'
  return 'molar'
}

/// Tishning ustidan koʻrinishdagi oʻlchami: `width` — ravoq boʻylab,
/// `depth` — ravoqqa tik. Tartib FDI ikkinchi raqami boʻyicha (1 — markaziy
/// kesuvchi). Pastki kesuvchilar yuqoridagidan ancha tor
const SIZES = {
  upper: [
    [34, 30],
    [27, 27],
    [30, 32],
    [27, 36],
    [27, 36],
    [40, 42],
    [37, 40],
    [34, 38],
  ],
  lower: [
    [22, 26],
    [24, 27],
    [28, 31],
    [27, 34],
    [28, 35],
    [42, 40],
    [39, 39],
    [35, 37],
  ],
  primaryUpper: [
    [24, 22],
    [20, 20],
    [22, 24],
    [27, 28],
    [31, 31],
  ],
  primaryLower: [
    [17, 19],
    [18, 20],
    [21, 23],
    [29, 28],
    [33, 30],
  ],
} as const satisfies Record<string, readonly (readonly [number, number])[]>

/// Ravoq — yarim ellips: `a` yarim kenglik, `b` chuqurlik, `center` —
/// ellips markazining y si (ravoq uchlari shu chiziqda tugaydi)
export interface ArchSpec {
  upper: boolean
  primary: boolean
  cx: number
  center: number
  a: number
  b: number
  /// Tishlar ravoqqa sigʻish uchun kattalashtirilishi mumkin boʻlgan chegara:
  /// ichki (sut) ravoqda 1 — tishlar oʻz oʻlchamida qoladi
  maxScale: number
}

export interface PlacedTooth {
  tooth: number
  type: ToothType
  x: number
  y: number
  /// Burilish (daraja): tishning lokal +y oʻqi ravoqdan tashqariga qaraydi
  angle: number
  /// Tashqi normal — raqam va koʻprik chizigʻi shu yoʻnalishda suriladi
  nx: number
  ny: number
  width: number
  depth: number
}

const GAP = 2
const SAMPLES = 600

/// Ravoq boʻylab tishlarni joylaydi: har tish oʻz kengligicha yoy oladi,
/// oʻrta chiziqdan chetga qarab. Ikkala yarmi ham qaytadi (FDI tartibida emas)
export function placeArch(spec: ArchSpec): PlacedTooth[] {
  const sign = spec.upper ? -1 : 1
  // Yoy uzunligi → parametr jadvali: tishlar teng burchak emas, teng yoy oladi
  const table: [number, number][] = []
  let length = 0
  let prev: [number, number] | null = null
  for (let i = 0; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * (Math.PI / 2)
    const point: [number, number] = [spec.a * Math.sin(t), sign * spec.b * Math.cos(t)]
    if (prev) length += Math.hypot(point[0] - prev[0], point[1] - prev[1])
    table.push([t, length])
    prev = point
  }
  const paramAt = (arc: number) => (table.find(([, l]) => l >= arc) ?? table[SAMPLES])?.[0] ?? 0

  const sizes = spec.primary
    ? spec.upper
      ? SIZES.primaryUpper
      : SIZES.primaryLower
    : spec.upper
      ? SIZES.upper
      : SIZES.lower
  const total = sizes.reduce((sum, [w]) => sum + w + GAP, 0)
  const k = Math.min(length / total, spec.maxScale)
  const kDepth = Math.max(0.8, Math.min(k, 1.6))

  // Koʻrinishda chap yarmi bemorning oʻng tomoni: yuqorida 1-chorak, pastda 4-chorak
  const quadrants = spec.primary ? (spec.upper ? [5, 6] : [8, 7]) : spec.upper ? [1, 2] : [4, 3]

  const placed: PlacedTooth[] = []
  for (const [sideIndex, side] of [-1, 1].entries()) {
    const quadrant = quadrants[sideIndex] ?? 0
    let arc = 0
    sizes.forEach(([w0, d0], index) => {
      const width = w0 * k
      arc += (GAP * k) / 2 + width / 2
      const t = paramAt(arc)
      arc += width / 2 + (GAP * k) / 2
      let nx = (side * Math.sin(t)) / spec.a
      let ny = (sign * Math.cos(t)) / spec.b
      const norm = Math.hypot(nx, ny)
      nx /= norm
      ny /= norm
      const tooth = quadrant * 10 + index + 1
      placed.push({
        tooth,
        type: toothType(tooth),
        x: spec.cx + side * spec.a * Math.sin(t),
        y: spec.center + sign * spec.b * Math.cos(t),
        angle: (Math.atan2(-nx, ny) * 180) / Math.PI,
        nx,
        ny,
        width,
        depth: d0 * kDepth,
      })
    })
  }
  return placed
}

const ALL_TEETH: readonly number[] = [...UPPER, ...LOWER, ...PRIMARY_UPPER, ...PRIMARY_LOWER]

export function isToothNo(value: unknown): boolean {
  return ALL_TEETH.includes(Number(value))
}

/// Koʻprik oraligʻidagi tishlar. Ikkala tish ham bitta jagʻda boʻlishi shart —
/// boʻlmasa boʻsh roʻyxat
export function bridgeSpan(from: number, to: number): number[] {
  const arch = [UPPER, LOWER].find((list) => list.includes(from) && list.includes(to))
  if (!arch) return []
  const a = arch.indexOf(from)
  const b = arch.indexOf(to)
  return [...arch].slice(Math.min(a, b), Math.max(a, b) + 1)
}
