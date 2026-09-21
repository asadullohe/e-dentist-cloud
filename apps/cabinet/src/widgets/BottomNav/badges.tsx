import { useFeedbackSummary } from '@/entities/feedback'
import { useQueue } from '@/features/queue-manage'

/// Navbat tabidagi son: bugun kutayotganlar. Komponent faqat ruxsat bor
/// xodimga chiziladi — soʻrov ham shunda ketadi
export function QueueBadge() {
  const { data } = useQueue()
  const waiting = data?.filter((row) => row.status === 'waiting').length ?? 0
  if (waiting === 0) return null
  return (
    <i className="bg-destructive text-destructive-foreground absolute top-1.5 right-[calc(50%-20px)] flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold not-italic shadow-[0_0_0_2px_var(--glass-lens)]">
      {waiting}
    </i>
  )
}

/// «Yana» tugmasidagi nuqta: koʻrilmagan fikrlar bor
export function FeedbackDot() {
  const { data } = useFeedbackSummary()
  if (!data || data.newCount === 0) return null
  return (
    <i className="bg-destructive absolute top-5 right-5 size-2 rounded-full shadow-[0_0_0_2px_var(--glass-lens)]" />
  )
}
