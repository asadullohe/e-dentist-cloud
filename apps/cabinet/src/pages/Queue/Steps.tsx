import { QUEUE_UI } from '@e-dentist/shared'
import { cn } from 'cn'

/// Uch qadam: shifokor → maʼlumotlar → raqam. Bemor qayerdaligini koʻradi
export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const labels = [QUEUE_UI.step_doctor, QUEUE_UI.step_name, QUEUE_UI.step_number]
  return (
    <ol className="mb-4 flex items-center gap-2" aria-label={QUEUE_UI.title}>
      {labels.map((label, index) => {
        const n = index + 1
        const done = n < current
        const active = n === current
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                active && 'bg-primary text-primary-foreground',
                done && 'bg-primary/15 text-primary',
                !active && !done && 'bg-muted text-muted-foreground',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {n}
            </span>
            <span
              className={cn(
                'truncate text-xs',
                active ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {n < 3 && <span className="bg-border h-px min-w-3 flex-1" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}
