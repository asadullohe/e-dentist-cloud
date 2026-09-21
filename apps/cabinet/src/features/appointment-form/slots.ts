import type { Appointment } from '@/entities/appointment'

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

export interface Slot {
  time: string
  busy: boolean
}

/// Kunning slotlari: qadam — davomiylik (15 daq dan kam emas, 30 dan koʻp
/// emas — 90 daqiqalik qabul uchun ham yarim soatlik qadam qulay). Slot
/// band — oʻsha oraliq shifokorning ochiq qabuli bilan kesishsa
export function daySlots(
  appointments: readonly Appointment[],
  duration: number,
  excludeId?: string,
): Slot[] {
  const step = Math.min(30, Math.max(15, duration))
  const busy = appointments
    .filter((a) => a.id !== excludeId && (a.status === 'scheduled' || a.status === 'arrived'))
    .map((a) => {
      const start = minutesOf(localTime(a.at))
      return { start, end: start + a.duration }
    })
  const slots: Slot[] = []
  for (let t = WORK_START * 60; t + duration <= WORK_END * 60; t += step) {
    const end = t + duration
    slots.push({ time: timeOfMinutes(t), busy: busy.some((b) => b.start < end && b.end > t) })
  }
  return slots
}
