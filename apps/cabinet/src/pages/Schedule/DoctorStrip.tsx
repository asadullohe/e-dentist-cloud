import { initialsOf } from '@/shared/lib'

/// Ustun sarlavhasi uchun shifokor; `id: null` — «Shifokorsiz» ustuni
export interface DoctorHead {
  id: string | null
  name: string
}

/// Shifokor ustunlari sarlavhasi — toʻr bilan bir xil toʻrda, ustunlar
/// tepasiga toʻgʻri tushadi. Yopishqoq blok ichida turadi: toʻr aylantirilganda
/// ham qaysi ustun kimniki koʻrinib tursin
export function DoctorStrip({ doctors }: { doctors: readonly DoctorHead[] }) {
  return (
    <div
      className="grid items-center gap-1 pb-2"
      style={{ gridTemplateColumns: `2.75rem repeat(${doctors.length}, minmax(0, 1fr))` }}
    >
      <div />
      {doctors.map((doctor) => (
        <div key={doctor.id ?? 'none'} className="flex min-w-0 items-center gap-1.5 px-1">
          <span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
            {doctor.id === null ? '—' : initialsOf(doctor.name)}
          </span>
          <span className="truncate text-xs font-medium">{doctor.name}</span>
        </div>
      ))}
    </div>
  )
}
