import { QUEUE_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import type { QueueTicket } from '@/entities/queue'
import { Button, Card } from '@/shared/ui'

/// Bemorning oʻz raqami. Boshqa odamlarning ismlari bu yerda ham koʻrinmaydi
export function Ticket({ ticket, onLeave }: { ticket: QueueTicket; onLeave(): void }) {
  const called = ticket.status === 'called'
  const finished = ticket.status === 'finished'

  return (
    <Card
      className={cn(
        'items-center p-6 text-center',
        called && 'border-ok bg-ok/10',
        finished && 'bg-muted',
      )}
    >
      <div className="text-muted-foreground text-sm">{QUEUE_UI.your_number}</div>
      <div className="font-display text-6xl font-bold tabular-nums">{ticket.number}</div>
      <div className="text-sm">{ticket.doctorName}</div>

      {called ? (
        <p className="text-ok text-lg font-semibold">{QUEUE_UI.called}</p>
      ) : finished ? (
        <p className="text-muted-foreground">{QUEUE_UI.finished}</p>
      ) : ticket.status === 'unconfirmed' ? (
        <p className="text-muted-foreground text-sm">{QUEUE_UI.unconfirmed_hint}</p>
      ) : (
        <p>
          {QUEUE_UI.ahead(ticket.ahead)}
          {ticket.ahead > 0 && ` · ${QUEUE_UI.wait_minutes(ticket.waitMinutes)}`}
        </p>
      )}

      {finished && (
        <Button variant="outline" size="sm" onClick={onLeave}>
          {QUEUE_UI.join}
        </Button>
      )}
    </Card>
  )
}
