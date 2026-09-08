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
  /// Emal gradienti: och → toʻq
  grad: readonly [string, string]
  stroke: string
}

/// Har material uchun qopqoq rangi
export const MATERIAL_STYLE: Record<CrownMaterial, ToothStyle> = {
  '': { grad: ['#f2ecfd', '#bfaee4'], stroke: '#6d5aa8' },
  keramika: { grad: ['#ffffff', '#dfe8ef'], stroke: '#7f93a5' },
  'metall-keramika': { grad: ['#fdfbf2', '#d6c79c'], stroke: '#9a8340' },
  sirkoniy: { grad: ['#fdfdff', '#d6dff0'], stroke: '#74839b' },
  metall: { grad: ['#f7e5a6', '#c39a2e'], stroke: '#846412' },
  plastmassa: { grad: ['#fff7ea', '#ecd9b8'], stroke: '#b0925f' },
}

/// Har holat uchun emal gradienti va kontur rangi
export const STATUS_STYLE: Record<ToothStatus, ToothStyle> = {
  soglom: { grad: ['#fffdf6', '#eae0c6'], stroke: '#c3b89e' },
  karies: { grad: ['#f7e7bd', '#dcae4f'], stroke: '#b97f10' },
  plomba: { grad: ['#dcebf8', '#8fb8d9'], stroke: '#2b6ca3' },
  koronka: { grad: ['#e9e3f8', '#b3a3dd'], stroke: '#6d5aa8' },
  koprik: { grad: ['#f2eee5', '#ded7c6'], stroke: '#8c8375' },
  implant: { grad: ['#d8efe9', '#7dbfae'], stroke: '#0e5e54' },
  davolanmoqda: { grad: ['#fbe0d8', '#eb9c88'], stroke: '#e0563f' },
  olingan: { grad: ['#f2eee5', '#e0d9c8'], stroke: '#b6ad99' },
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

export const TYPE_SCALE: Record<ToothType, number> = {
  incisor: 0.94,
  canine: 0.98,
  premolar: 1.02,
  molar: 1.06,
}

export const TYPE_WIDTH: Record<ToothType, number> = {
  incisor: 28,
  canine: 26,
  premolar: 32,
  molar: 44,
}

/// Ravoq boʻylab 0..1 pozitsiyalar: har tish oʻz kengligiga yarasha joy oladi
export function archLayout(list: readonly number[]): number[] {
  const GAP = 3
  const widths = list.map((tooth) => {
    const type = toothType(tooth)
    return TYPE_WIDTH[type] * TYPE_SCALE[type] * 0.95
  })
  const total = widths.reduce((a, b) => a + b, 0) + GAP * (list.length - 1)

  let offset = 0
  return list.map((_, index) => {
    const width = widths[index] ?? 0
    const center = offset + width / 2
    offset += width + GAP
    return center / total
  })
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
