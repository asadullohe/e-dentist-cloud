import type { Db } from '../../src/platform/db.js'
import type { Client } from './client.js'
import type { Area, StaffKey } from './data.js'

export interface ServiceRef {
  id: string
  name: string
  price: number
  area: Area
  techPrice?: number
}

export interface Ctx {
  db: Db
  clinicId: string
  owner: Client
  sardor: Client
  bobur: Client
  staff: Record<StaffKey, string>
  services: Record<string, ServiceRef>
  slots: Slots
  rand: () => number
}

export function pick<T>(ctx: Ctx, list: readonly T[]): T {
  const item = list[Math.floor(ctx.rand() * list.length)]
  if (item === undefined) throw new Error('pick: boʻsh roʻyxat')
  return item
}

export const int = (ctx: Ctx, min: number, max: number) =>
  min + Math.floor(ctx.rand() * (max - min + 1))

export const chance = (ctx: Ctx, p: number) => ctx.rand() < p

/// Pulni 10 000 ga yaxlitlash — kassada shunday olinadi
export const roundMoney = (n: number) => Math.max(10_000, Math.round(n / 10_000) * 10_000)

const DAY_START = 9 * 60
const DAY_END = 18 * 60

/// Shifokorning kunlik band vaqtlari — API bir-birini kesgan qabulni 409
/// bilan qaytaradi, shuning uchun vaqt oldindan shu yerda ajratiladi
export class Slots {
  private busy = new Map<string, [number, number][]>()

  /// Boʻsh vaqt topib band qiladi (daqiqa); topilmasa null
  take(doctorId: string, date: string, duration: number, from = DAY_START): number | null {
    const key = `${doctorId}:${date}`
    const taken = this.busy.get(key) ?? []
    for (let start = from; start + duration <= DAY_END; start += 30) {
      if (start >= 13 * 60 && start < 14 * 60) continue // tushlik
      const end = start + duration
      if (taken.every(([s, e]) => end <= s || start >= e)) {
        taken.push([start, end])
        this.busy.set(key, taken)
        return start
      }
    }
    return null
  }
}
