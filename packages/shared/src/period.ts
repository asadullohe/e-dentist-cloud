// Davr: kun · hafta · oy · yil. Xarajatlar va hisobotlar sahifasi shu
// bilan yuradi — server esa faqat `from`/`to` (YYYY-MM-DD) oladi.
//
// Sana matematikasi mahalliy vaqtda (`new Date(y, m, d)`): kun chegarasi
// klinika kuni. Hafta dushanbadan yakshanbagacha.

import { formatDate, localISODate } from './format.js'
import { MONTHS, MONTHS_SHORT, PERIOD_UI } from './strings.js'

export type PeriodKind = 'day' | 'week' | 'month' | 'year'
export const PERIOD_KINDS: readonly PeriodKind[] = ['day', 'week', 'month', 'year']

export interface Period {
  kind: PeriodKind
  /// Davr ichidagi istalgan kun, YYYY-MM-DD
  anchor: string
}

export interface DateRange {
  from: string
  to: string
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

/// Dushanba = 0 … yakshanba = 6
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

export function periodRange({ kind, anchor }: Period): DateRange {
  const a = parse(anchor)
  switch (kind) {
    case 'day':
      return { from: anchor, to: anchor }
    case 'week': {
      const from = new Date(a.getFullYear(), a.getMonth(), a.getDate() - weekdayIndex(a))
      const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6)
      return { from: localISODate(from), to: localISODate(to) }
    }
    case 'month':
      return {
        from: localISODate(new Date(a.getFullYear(), a.getMonth(), 1)),
        to: localISODate(new Date(a.getFullYear(), a.getMonth() + 1, 0)),
      }
    case 'year':
      return {
        from: localISODate(new Date(a.getFullYear(), 0, 1)),
        to: localISODate(new Date(a.getFullYear(), 11, 31)),
      }
  }
}

/// Oldingi/keyingi davr. Oy va yil uchun sana 1-kunga olinadi — 31 yanvar
/// dan «keyingi oy» 3 mart boʻlib ketmasin
export function shiftPeriod({ kind, anchor }: Period, by: number): Period {
  const a = parse(anchor)
  let next: Date
  switch (kind) {
    case 'day':
      next = new Date(a.getFullYear(), a.getMonth(), a.getDate() + by)
      break
    case 'week':
      next = new Date(a.getFullYear(), a.getMonth(), a.getDate() + by * 7)
      break
    case 'month':
      next = new Date(a.getFullYear(), a.getMonth() + by, 1)
      break
    case 'year':
      next = new Date(a.getFullYear() + by, 0, 1)
      break
  }
  return { kind, anchor: localISODate(next) }
}

/// Ikki davr bir xilmi (chegaralari teng)
export function samePeriod(a: Period, b: Period): boolean {
  if (a.kind !== b.kind) return false
  const ra = periodRange(a)
  const rb = periodRange(b)
  return ra.from === rb.from && ra.to === rb.to
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/// Sarlavha: «21/09/2026» · «15–21 sen 2026» · «29 sen – 5 okt 2026» ·
/// «Sentabr 2026» · «2026»
export function formatPeriod(period: Period): string {
  const { from, to } = periodRange(period)
  const f = parse(from)
  const t = parse(to)
  switch (period.kind) {
    case 'day':
      return formatDate(from)
    case 'week': {
      const sameMonth = f.getMonth() === t.getMonth() && f.getFullYear() === t.getFullYear()
      if (sameMonth)
        return `${f.getDate()}–${t.getDate()} ${MONTHS_SHORT[t.getMonth()]} ${t.getFullYear()}`
      const sameYear = f.getFullYear() === t.getFullYear()
      const left = `${f.getDate()} ${MONTHS_SHORT[f.getMonth()]}${sameYear ? '' : ` ${f.getFullYear()}`}`
      return `${left} – ${t.getDate()} ${MONTHS_SHORT[t.getMonth()]} ${t.getFullYear()}`
    }
    case 'month':
      return `${capitalize(MONTHS[f.getMonth()] ?? '')} ${f.getFullYear()}`
    case 'year':
      return String(f.getFullYear())
  }
}

/// «Bugun» · «Shu hafta» · «Shu oy» · «Shu yil» — joriy davrga qaytish tugmasi
export function currentPeriodLabel(kind: PeriodKind): string {
  return PERIOD_UI.current[kind]
}
