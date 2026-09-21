import { QUEUE_UI } from '@e-dentist/shared'
import { ChevronRightIcon } from 'lucide-react'
import type { QueueDoctor } from '@/entities/queue'

/// 1-qadam: shifokor kartalari — navbat, kutish vaqti va hozir qabuldagi raqam
export function DoctorList({
  doctors,
  onPick,
}: {
  doctors: QueueDoctor[]
  onPick: (id: string) => void
}) {
  if (doctors.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{QUEUE_UI.no_doctors}</p>
  }
  return (
    <div className="space-y-2">
      {doctors.map((doctor) => (
        <button
          key={doctor.id}
          type="button"
          onClick={() => onPick(doctor.id)}
          className="bg-card hover:bg-accent active:bg-accent flex w-full items-center gap-3 rounded-xl border p-4 text-left shadow-xs transition-colors"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{doctor.fullName}</div>
            <div className="text-muted-foreground mt-0.5 text-sm">
              {QUEUE_UI.waiting(doctor.waiting)}
              {doctor.waiting > 0 && ` · ${QUEUE_UI.wait_minutes(doctor.waitMinutes)}`}
            </div>
            {/* «Hozir boʻsh» faqat navbat ham boʻsh boʻlganda — aks holda yolgʻon */}
            {(doctor.nowServing !== null || doctor.waiting === 0) && (
              <div className="mt-1 text-xs">
                {doctor.nowServing !== null ? (
                  <span className="text-primary font-medium">
                    {QUEUE_UI.now_serving(doctor.nowServing)}
                  </span>
                ) : (
                  <span className="text-ok font-medium">{QUEUE_UI.free_now}</span>
                )}
              </div>
            )}
          </div>
          <ChevronRightIcon className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
