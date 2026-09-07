import { toDbDate, UI_TEXT } from '@e-dentist/shared'
import { cn } from 'cn'
import type { SessionClinic } from '@/entities/session'

const DAY_MS = 86_400_000
const URGENT_DAYS = 3

function daysLeft(expiresAt: string): number {
  return Math.round((new Date(expiresAt).getTime() - toDbDate().getTime()) / DAY_MS)
}

export function TrialBanner({ clinic }: { clinic: SessionClinic | null }) {
  if (!clinic?.isTrial) return null

  const days = daysLeft(clinic.expiresAt)
  // Uch kundan kam qolganda diqqatni tortadi
  const urgent = days <= URGENT_DAYS

  return (
    <div
      className={cn(
        'mb-4 rounded-md border px-3.5 py-2 text-sm',
        urgent
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-warn/35 bg-warn/10 text-foreground',
      )}
    >
      {days > 0 ? UI_TEXT.trial_left(days) : UI_TEXT.trial_over}
    </div>
  )
}
