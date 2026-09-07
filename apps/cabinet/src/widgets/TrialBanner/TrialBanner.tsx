import { toDbDate, UI_TEXT } from '@e-dentist/shared'
import type { SessionClinic } from '../../entities/session'
import styles from './TrialBanner.module.scss'

const DAY_MS = 86_400_000
const URGENT_DAYS = 3

function daysLeft(expiresAt: string): number {
  return Math.round((new Date(expiresAt).getTime() - toDbDate().getTime()) / DAY_MS)
}

export function TrialBanner({ clinic }: { clinic: SessionClinic | null }) {
  if (!clinic?.isTrial) return null

  const days = daysLeft(clinic.expiresAt)
  const urgent = days <= URGENT_DAYS

  return (
    <div className={`${styles.banner}${urgent ? ` ${styles.urgent}` : ''}`}>
      {days > 0 ? UI_TEXT.trial_left(days) : UI_TEXT.trial_over}
    </div>
  )
}
