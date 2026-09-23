import type { Ref } from 'react'
import { initialsOf } from '@/shared/lib'
import { COLUMNS_TEMPLATE } from './scheduleUtils'

/// Ustun sarlavhasi uchun shifokor; `id: null` — «Shifokorsiz» ustuni
export interface DoctorHead {
  id: string | null
  name: string
  /// Shu kundagi qabullar soni
  count: number
}

/// Shifokor ustunlari sarlavhasi — toʻr bilan bir xil toʻrda. Yopishqoq blok
/// ichida turadi (toʻr pastga aylantirilganda ham koʻrinadi), toʻr yonga
/// surilganda esa `ref` orqali u bilan birga suriladi
export function DoctorStrip({
  doctors,
  ref,
}: {
  doctors: readonly DoctorHead[]
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <div ref={ref} className="overflow-hidden pb-2">
      <div
        className="grid items-center gap-1"
        style={{ gridTemplateColumns: COLUMNS_TEMPLATE(doctors.length) }}
      >
        <div />
        {doctors.map((doctor) => (
          <div key={doctor.id ?? 'none'} className="flex min-w-0 items-center gap-1.5 px-1">
            <span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
              {doctor.id === null ? '—' : initialsOf(doctor.name)}
            </span>
            <span className="truncate text-xs font-medium">{doctor.name}</span>
            <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">
              {doctor.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
