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

/// Holat rangi bir joyda: kartochka foni, ikonka va yorliq (chip) bir xil
/// oilaga tegishli boʻlsin — jadvalda ham, qabul oynasida ham
export interface StatusTone {
  /// Kartochka foni (hoshiya yoʻq — toʻliq rang maydoni uzoqdan oʻqiladi)
  fill: string
  /// Ikonka va urgʻu rangi
  tone: string
  /// Yumaloq yorliq
  badge: string
}

export function statusTone(status: AppointmentStatus): StatusTone {
  if (status === 'arrived')
    return { fill: 'bg-ok/15 hover:bg-ok/22', tone: 'text-ok', badge: 'bg-ok/15 text-ok' }
  if (status === 'done')
    return {
      fill: 'bg-muted hover:bg-muted/70 text-muted-foreground',
      tone: 'text-muted-foreground',
      badge: 'bg-muted text-muted-foreground',
    }
  if (status === 'no_show')
    return { fill: 'bg-warn/15 hover:bg-warn/22', tone: 'text-warn', badge: 'bg-warn/15 text-warn' }
  if (status === 'cancelled')
    return {
      fill: 'bg-destructive/10 hover:bg-destructive/16 text-muted-foreground line-through',
      tone: 'text-destructive',
      badge: 'bg-destructive/10 text-destructive',
    }
  return {
    fill: 'bg-primary/10 hover:bg-primary/16',
    tone: 'text-primary',
    badge: 'bg-primary/10 text-primary',
  }
}

export const timeOf = (iso: string) => {
  const date = new Date(iso)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
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

/// Toʻr va sarlavha tasmalari bitta toʻrda turadi: chapda vaqt oʻqi, keyin
/// ustunlar. Telefonda ustun 7.5rem dan kichraymaydi — toʻr yonga suriladi
export const COLUMNS_TEMPLATE = (count: number) => `2.75rem repeat(${count}, minmax(7.5rem, 1fr))`

/// Toʻr ustuni. Kunlar rejimida har ustun — bir kun, hamma shifokor bilan;
/// shifokorlar rejimida hammasi bitta kun, ustun — bitta shifokor.
/// `doctorId`: `undefined` — hamma, `null` — shifokorsizlar ustuni
export interface GridColumn {
  key: string
  date: string
  doctorId?: string | null
}

const inColumn = (item: Appointment, column: GridColumn) =>
  isoOfDate(new Date(item.at)) === column.date &&
  (column.doctorId === undefined || item.doctorId === column.doctorId)

/// Toʻr sukut boʻyicha ish soatlarini koʻrsatadi; undan tashqarida yozuv
/// boʻlsa (erta kelgan navbat, kechki qabul) toʻr oʻsha tomonga kengayadi
const WORK_START = 8
const WORK_END = 20

export function hourRange(
  appointments: readonly Appointment[],
  blocks: readonly { startsAt: string; endsAt: string }[],
): { startHour: number; endHour: number } {
  let start = WORK_START
  let end = WORK_END
  const stretch = (from: Date, to: Date) => {
    start = Math.min(start, from.getHours())
    // Tugash daqiqasi soat boshida boʻlmasa — keyingi soatgacha
    end = Math.max(end, to.getHours() + (to.getMinutes() > 0 ? 1 : 0))
  }
  for (const item of appointments) {
    const from = new Date(item.at)
    stretch(from, new Date(from.getTime() + item.duration * 60_000))
  }
  for (const block of blocks) stretch(new Date(block.startsAt), new Date(block.endsAt))
  return { startHour: Math.max(0, start), endHour: Math.min(24, Math.max(end, start + 1)) }
}

/// Har ustun uchun oʻz qabullari — ustunlar tartibida
export function splitByColumn(
  columns: readonly GridColumn[],
  appointments: readonly Appointment[],
): Appointment[][] {
  return columns.map((column) => appointments.filter((item) => inColumn(item, column)))
}

/// Tugash vaqti — boshlanish + davomiylik
export function endTimeOf(item: Appointment): string {
  const end = new Date(new Date(item.at).getTime() + item.duration * 60_000)
  return `${pad(end.getHours())}:${pad(end.getMinutes())}`
}
