import type { Appointment, TimeBlock } from '@/entities/appointment'

/// Ish kuni: 08:00–20:00. Keyinroq klinika sozlamasi boʻladi
export const WORK_START = 8
export const WORK_END = 20
export const DURATIONS = [15, 30, 45, 60, 90, 120] as const

const pad = (n: number) => String(n).padStart(2, '0')

export const minutesOf = (time: string): number => {
  const [h = 0, m = 0] = time.split(':').map(Number)
  return h * 60 + m
}
export const timeOfMinutes = (total: number): string =>
  `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`

/// Lahzaning mahalliy «SS:DD» si
export function localTime(iso: string): string {
  const date = new Date(iso)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/// Band vaqtning shu kundagi daqiqa oraligʻi; kun tashqarisida — null.
/// Oldingi kundan boshlangan taʼtil 0 dan, keyingi kunga oʻtgani 1440 gacha
export function blockMinutes(
  block: TimeBlock,
  date?: string,
): { start: number; end: number } | null {
  const day = date ?? localDate(block.startsAt)
  const dayStart = new Date(`${day}T00:00:00`).getTime()
  const dayEnd = dayStart + 24 * 60 * 60_000
  const s = new Date(block.startsAt).getTime()
  const e = new Date(block.endsAt).getTime()
  if (e <= dayStart || s >= dayEnd) return null
  return {
    start: Math.max(0, Math.round((s - dayStart) / 60_000)),
    end: Math.min(24 * 60, Math.round((e - dayStart) / 60_000)),
  }
}

export function localDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const overlaps = (r: { start: number; end: number }, from: number, to: number) =>
  r.start < to && r.end > from

export interface BusyRange {
  start: number
  end: number
  /// Toʻr katagida koʻrinadigan nom: bemor familiyasi yoki band vaqt sababi
  label: string
}

/// Shifokorning shu kundagi band oraliqlari (daqiqada): ochiq qabullar
/// (tahrirlanayotgani hisobga olinmaydi) va band vaqtlar
export function busyRanges(
  appointments: readonly Appointment[],
  excludeId?: string,
  blocks: readonly TimeBlock[] = [],
  /// YYYY-MM-DD — koʻp kunlik band vaqt shu kunga qirqiladi
  date?: string,
  blockLabel = '',
): BusyRange[] {
  const busy: BusyRange[] = appointments
    .filter((a) => a.id !== excludeId && (a.status === 'scheduled' || a.status === 'arrived'))
    .map((a) => {
      const start = minutesOf(localTime(a.at))
      return { start, end: start + a.duration, label: a.fio.split(' ')[0] ?? a.fio }
    })
  for (const block of blocks) {
    const range = blockMinutes(block, date)
    if (range) busy.push({ ...range, label: block.reason || blockLabel })
  }
  return busy
}

/// Kunning birinchi boʻsh oraligʻi: `from` daqiqadan boshlab 15 daqiqalik
/// qadam bilan, davomiylik sigʻadigan va band bilan kesishmaydigan joy.
/// Topilmasa null
export function firstFreeSlot(
  busy: readonly BusyRange[],
  duration: number,
  from = WORK_START * 60,
): string | null {
  const start = Math.max(WORK_START * 60, Math.ceil(from / 15) * 15)
  for (let t = start; t + duration <= WORK_END * 60; t += 15) {
    if (!busy.some((r) => overlaps(r, t, t + duration))) return timeOfMinutes(t)
  }
  return null
}
