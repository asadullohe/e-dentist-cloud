import { MONTHS } from '@e-dentist/shared'
import type { Appointment, AppointmentStatus } from '@/entities/appointment'

export const pad = (n: number) => String(n).padStart(2, '0')
export const isoOf = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`
export const isoOfDate = (date: Date) => isoOf(date.getFullYear(), date.getMonth(), date.getDate())

/// Dushanbadan boshlanadigan hafta: getDay() da yakshanba 0, bizda oxirgi
export const mondayFirst = (date: Date) => (date.getDay() + 6) % 7

export const parseIso = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

/// Sanani oʻz ichiga olgan hafta — dushanbadan yakshanbagacha, 7 ta ISO kun
export function weekOf(iso: string): string[] {
  const date = parseIso(iso)
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayFirst(date))
  return Array.from({ length: 7 }, (_, i) =>
    isoOfDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)),
  )
}

export function shiftDays(iso: string, by: number): string {
  const date = parseIso(iso)
  return isoOfDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + by))
}

export const STATUSES: AppointmentStatus[] = [
  'scheduled',
  'arrived',
  'done',
  'no_show',
  'cancelled',
]

/// Holat belgisi: keldi — sariq, yakunlandi — yashil, kelmadi/bekor — qizil
export function statusBadge(status: AppointmentStatus): string {
  if (status === 'done') return 'border-ok/30 bg-ok/10 text-ok'
  if (status === 'arrived') return 'border-warn/40 bg-warn/15 text-foreground'
  if (status === 'no_show' || status === 'cancelled')
    return 'border-destructive/30 bg-destructive/10 text-destructive'
  return ''
}

/// Vaqt toʻridagi blok rangi: rejalashtirilgan — koʻk, keldi — yashil,
/// yakunlangan — kulrang, kelmadi/bekor — xira qizil
export function blockClass(status: AppointmentStatus): string {
  if (status === 'arrived') return 'border-ok bg-ok/15 text-foreground'
  if (status === 'done') return 'border-muted-foreground/60 bg-muted text-muted-foreground'
  if (status === 'no_show' || status === 'cancelled')
    return 'border-destructive/50 bg-destructive/10 text-muted-foreground line-through'
  return 'border-primary bg-primary/12 text-foreground'
}

export const timeOf = (iso: string) => {
  const date = new Date(iso)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function monthTitle(year: number, month: number): string {
  const name = MONTHS[month] ?? ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`
}

/// Bir vaqtda kesishgan qabullar (masalan, ikki shifokorniki) ustma-ust
/// tushmasin: kesishganlar guruhga yigʻiladi, guruh ichida har biriga
/// alohida yoʻlak beriladi — blok kengligi yoʻlaklar soniga boʻlinadi
export interface Placed {
  item: Appointment
  lane: number
  lanes: number
}

export function layoutDay(items: readonly Appointment[]): Placed[] {
  const sorted = [...items].sort((a, b) => a.at.localeCompare(b.at))
  const result: Placed[] = []
  let cluster: { placed: Placed[]; laneEnds: number[]; end: number } | null = null

  for (const item of sorted) {
    const start = new Date(item.at).getTime()
    const end = start + item.duration * 60_000
    if (!cluster || start >= cluster.end) {
      cluster = { placed: [], laneEnds: [], end }
    }
    // Boʻshagan birinchi yoʻlak, boʻlmasa yangisi
    let lane = cluster.laneEnds.findIndex((laneEnd) => laneEnd <= start)
    if (lane === -1) lane = cluster.laneEnds.length
    cluster.laneEnds[lane] = end
    cluster.end = Math.max(cluster.end, end)
    const placed = { item, lane, lanes: 1 }
    cluster.placed.push(placed)
    for (const p of cluster.placed) p.lanes = cluster.laneEnds.length
    result.push(placed)
  }
  return result
}

export function groupByDay(appointments: readonly Appointment[]): Map<string, Appointment[]> {
  const byDay = new Map<string, Appointment[]>()
  for (const item of appointments) {
    const key = isoOfDate(new Date(item.at))
    byDay.set(key, [...(byDay.get(key) ?? []), item])
  }
  return byDay
}
