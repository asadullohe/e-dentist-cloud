import { toDbDate, UI_TEXT } from '@e-dentist/shared'
import { cn } from 'cn'
import type { SessionSubscription } from '@/entities/session'

const DAY_MS = 86_400_000
const URGENT_DAYS = 3

function daysLeft(expiresAt: string): number {
  return Math.round((new Date(expiresAt).getTime() - toDbDate().getTime()) / DAY_MS)
}

/// Sinov muddati va obuna holati. Muddat tugasa yozish yopiladi —
/// buni foydalanuvchi tugmani bosishdan oldin bilishi kerak (tz.md 8-boʻlim)
export function TrialBanner({ subscription }: { subscription: SessionSubscription | null }) {
  if (!subscription) return null
  if (!subscription.isTrial && !subscription.readOnly) return null

  const days = daysLeft(subscription.expiresAt)
  const urgent = subscription.readOnly || days <= URGENT_DAYS

  const message = subscription.readOnly
    ? subscription.isTrial
      ? UI_TEXT.trial_over
      : UI_TEXT.subscription_over
    : UI_TEXT.trial_left(days)

  return (
    <div
      className={cn(
        'mb-4 rounded-md border px-3.5 py-2 text-sm',
        urgent
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-warn/35 bg-warn/10 text-foreground',
      )}
    >
      {message}
    </div>
  )
}
