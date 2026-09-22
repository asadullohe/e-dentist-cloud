import { formatDate, todayISO } from '@e-dentist/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  APPOINTMENT_KEYS,
  type Appointment,
  fetchAppointments,
  fetchTimeBlocks,
  type TimeBlock,
} from '@/entities/appointment'
import { type BusyRange, busyRanges, firstFreeSlot, WORK_START } from './slots'

/// Keyingi kunlarni shu qadar oldinga qarab izlaydi
const LOOKAHEAD_DAYS = 14

const shiftIso = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  const date = new Date(y, m - 1, d + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const nowMinutes = () => new Date().getHours() * 60 + new Date().getMinutes()

export type AutoSlotResult =
  | { kind: 'placed' }
  | { kind: 'next'; date: string; time: string; label: string }
  | { kind: 'none' }

/// «Boʻsh joyga qoʻyish»: tanlangan kunda davomiylik sigʻadigan birinchi
/// boʻsh oraliq (bugun — hozirdan keyin). Sigʻmasa yaqin ikki haftadan
/// birinchi boʻsh kun taklif qilinadi — koʻchish qoʻlda, saqlash ham
export function useAutoSlot({
  date,
  doctorId,
  busy,
  duration,
  excludeId,
  blockLabel,
  onTime,
}: {
  date: string | null
  doctorId: string | null
  busy: readonly BusyRange[]
  duration: number
  excludeId?: string
  blockLabel: string
  onTime: (time: string) => void
}) {
  const queryClient = useQueryClient()
  const [result, setResult] = useState<AutoSlotResult | null>(null)
  const [searching, setSearching] = useState(false)

  async function place() {
    if (!date || !doctorId) return
    const from = date === todayISO() ? nowMinutes() + 5 : WORK_START * 60
    const today = firstFreeSlot(busy, duration, from)
    if (today) {
      onTime(today)
      setResult({ kind: 'placed' })
      return
    }
    setSearching(true)
    try {
      const to = shiftIso(date, LOOKAHEAD_DAYS)
      const from2 = shiftIso(date, 1)
      const [appointments, blocks] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: APPOINTMENT_KEYS.range(from2, to, doctorId),
          queryFn: () => fetchAppointments(from2, to, doctorId),
        }),
        queryClient.fetchQuery({
          queryKey: APPOINTMENT_KEYS.blocks(from2, to, doctorId),
          queryFn: () => fetchTimeBlocks(from2, to, doctorId),
        }),
      ])
      for (let day = from2; day <= to; day = shiftIso(day, 1)) {
        const own = (appointments as Appointment[]).filter((a) => a.at.slice(0, 10) === day)
        const ranges = busyRanges(own, excludeId, blocks as TimeBlock[], day, blockLabel)
        const time = firstFreeSlot(ranges, duration)
        if (time) {
          setResult({ kind: 'next', date: day, time, label: formatDate(day) })
          return
        }
      }
      setResult({ kind: 'none' })
    } finally {
      setSearching(false)
    }
  }

  return { place, result, searching, clear: () => setResult(null) }
}
