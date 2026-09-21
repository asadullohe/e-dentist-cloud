import { QUEUE_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { StarIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { QueueTicket } from '@/entities/queue'
import { Button, Card } from '@/shared/ui'

/// 3-qadam: bemorning oʻz raqami. Boshqa odamlarning ismlari bu yerda ham
/// koʻrinmaydi. Qabul tugagach — «qanday oʻtdi?» yulduzlari (fikr sahifasiga)
export function Ticket({
  code,
  ticket,
  nowServing,
  feedbackGiven,
  onLeave,
}: {
  code: string
  ticket: QueueTicket
  nowServing: number | null
  feedbackGiven: boolean
  onLeave(): void
}) {
  const called = ticket.status === 'called'
  const finished = ticket.status === 'finished'
  const unconfirmed = ticket.status === 'unconfirmed'

  return (
    <div className="space-y-3">
      <Card
        className={cn(
          'items-center gap-2 p-6 text-center',
          called && 'border-ok bg-ok/10',
          finished && 'bg-muted',
        )}
      >
        <div className="text-muted-foreground text-sm">{QUEUE_UI.your_number}</div>
        <div className={cn('text-7xl font-bold tabular-nums', called && 'text-ok')}>
          {ticket.number}
        </div>
        <div className="text-sm font-medium">{ticket.doctorName}</div>

        {called ? (
          <p className="text-ok mt-2 text-lg font-semibold">{QUEUE_UI.called}</p>
        ) : finished ? (
          <p className="text-muted-foreground mt-2">{QUEUE_UI.finished}</p>
        ) : unconfirmed ? (
          <p className="text-muted-foreground mt-2 text-sm">{QUEUE_UI.unconfirmed_hint}</p>
        ) : (
          <div className="mt-2 w-full space-y-2">
            <p className="font-medium">
              {QUEUE_UI.progress(ticket.ahead)}
              {ticket.ahead > 0 && (
                <span className="text-muted-foreground font-normal">
                  {' '}
                  · {QUEUE_UI.wait_minutes(ticket.waitMinutes)}
                </span>
              )}
            </p>
            {nowServing !== null && (
              <p className="text-muted-foreground text-xs">{QUEUE_UI.now_serving(nowServing)}</p>
            )}
            <p className="text-muted-foreground text-xs">{QUEUE_UI.keep_open}</p>
          </div>
        )}
      </Card>

      {finished && (
        <Card className="items-center gap-2 p-5 text-center">
          {feedbackGiven ? (
            <p className="font-medium">{QUEUE_UI.feedback_done}</p>
          ) : (
            <>
              <p className="font-semibold">{QUEUE_UI.feedback_prompt}</p>
              <p className="text-muted-foreground text-xs">{QUEUE_UI.feedback_prompt_hint}</p>
              {/* Yulduz bosilishi bilan fikr sahifasi ochiladi — baho tayyor */}
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Link
                    key={n}
                    to={`/f/${code}?ticket=${ticket.id}&rating=${n}`}
                    aria-label={String(n)}
                    className="text-muted-foreground hover:text-warn p-1"
                  >
                    <StarIcon className="size-8" />
                  </Link>
                ))}
              </div>
            </>
          )}
          <Button variant="outline" size="sm" className="mt-2" onClick={onLeave}>
            {QUEUE_UI.join_again}
          </Button>
        </Card>
      )}
    </div>
  )
}
