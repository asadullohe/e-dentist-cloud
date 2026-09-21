import { SCHEDULE_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { BanIcon } from 'lucide-react'
import { type Appointment, useAppointments, useTimeBlocks } from '@/entities/appointment'
import { Skeleton } from '@/shared/ui'
import { daySlots } from './slots'

/// Boʻsh vaqtlar toʻri: tanlangan kun va shifokor uchun, band slotlar
/// oʻchirilgan. Tahrirda qabulning oʻzi band hisoblanmaydi
export function SlotGrid({
  date,
  doctorId,
  duration,
  value,
  excludeId,
  onPick,
}: {
  /// YYYY-MM-DD
  date: string
  doctorId: string | null
  duration: number
  value: string
  excludeId?: string
  onPick: (time: string) => void
}) {
  const { data, isPending } = useAppointments(date, date, doctorId ?? undefined)
  const { data: blocks } = useTimeBlocks(date, date, doctorId ?? undefined)
  if (!doctorId) {
    return <p className="text-muted-foreground text-xs">{SCHEDULE_UI.pick_doctor_first}</p>
  }
  if (isPending) return <Skeleton className="h-24 w-full" />

  const slots = daySlots((data ?? []) as Appointment[], duration, excludeId, blocks ?? [], date)
  const free = slots.filter((slot) => !slot.busy)
  if (free.length === 0) {
    return <p className="text-muted-foreground text-xs">{SCHEDULE_UI.no_slots}</p>
  }
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
      {slots.map((slot) => (
        <button
          key={slot.time}
          type="button"
          disabled={slot.busy}
          aria-pressed={slot.time === value}
          onClick={() => onPick(slot.time)}
          className={cn(
            'flex h-9 items-center justify-center gap-1 rounded-md border text-sm tabular-nums transition-colors',
            slot.busy
              ? 'text-muted-foreground bg-muted border-dashed'
              : slot.time === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent',
          )}
        >
          {slot.time}
          {slot.busy && <BanIcon className="size-3 opacity-60" aria-hidden="true" />}
        </button>
      ))}
    </div>
  )
}
