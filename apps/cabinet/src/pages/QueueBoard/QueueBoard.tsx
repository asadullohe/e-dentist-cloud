import {
  formatDateTime,
  formatUzPhone,
  QUEUE_CABINET_UI,
  QUEUE_STATUS_LABELS,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { ExternalLinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { type QueueEntry, useQueueStream } from '@/entities/queue'
import { useSession } from '@/entities/session'
import { type QueueAction, useQueue, useQueueAction } from '@/features/queue-manage'
import { Badge, Button, Card, EmptyState, Skeleton } from '@/shared/ui'

/// Har holatda qaysi tugmalar koʻrinadi. Server ham shu oqimni tekshiradi
const ACTIONS: Record<string, { action: QueueAction; label: string; primary?: boolean }[]> = {
  unconfirmed: [{ action: 'confirm', label: QUEUE_CABINET_UI.confirm, primary: true }],
  waiting: [
    { action: 'call', label: QUEUE_CABINET_UI.call, primary: true },
    { action: 'no_show', label: QUEUE_CABINET_UI.no_show },
  ],
  called: [
    { action: 'done', label: QUEUE_CABINET_UI.done, primary: true },
    { action: 'arrived', label: QUEUE_CABINET_UI.arrived },
    { action: 'no_show', label: QUEUE_CABINET_UI.no_show },
  ],
  finished: [],
}

function tone(status: string): string {
  if (status === 'called') return 'bg-ok/10 border-ok/30'
  if (status === 'unconfirmed') return 'bg-warn/10 border-warn/30'
  if (status === 'finished') return 'opacity-60'
  return ''
}

export function QueueBoard() {
  const { data: session } = useSession()
  const { data: entries, isPending } = useQueue()
  const { mutate: act, isPending: isSaving } = useQueueAction()

  // Boshqa xodim navbatni oʻzgartirsa roʻyxat oʻzi yangilanadi
  const code = session?.clinic?.queueCode ?? ''
  useQueueStream(code)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{QUEUE_CABINET_UI.title}</h1>
        {code && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/n/${code}`} target="_blank" rel="noreferrer">
                <ExternalLinkIcon />
                {QUEUE_CABINET_UI.page_link}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/n/${code}/ekran`} target="_blank" rel="noreferrer">
                <ExternalLinkIcon />
                {QUEUE_CABINET_UI.screen_link}
              </a>
            </Button>
          </div>
        )}
      </div>

      {isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : entries?.length === 0 ? (
        <Card className="py-0">
          <EmptyState icon="🔔" text={QUEUE_CABINET_UI.empty} />
        </Card>
      ) : (
        <div className="space-y-2">
          {entries?.map((entry: QueueEntry) => (
            <Card
              key={entry.id}
              className={cn('gap-2 p-3 sm:flex-row sm:items-center', tone(entry.status))}
            >
              <div className="font-display w-12 shrink-0 text-2xl font-bold tabular-nums">
                {entry.number}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{entry.fio}</span>
                  <Badge variant="secondary">{QUEUE_STATUS_LABELS[entry.status]}</Badge>
                  {entry.patientId === null && (
                    <Badge variant="outline">{QUEUE_CABINET_UI.new_patient}</Badge>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  {entry.phone ? `${formatUzPhone(entry.phone)} · ` : ''}
                  {entry.doctorName} · {formatDateTime(entry.at)}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {entry.patientId && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/patients/${entry.patientId}`}>{QUEUE_CABINET_UI.link}</Link>
                  </Button>
                )}
                {ACTIONS[entry.status]?.map(({ action, label, primary }) => (
                  <Button
                    key={action}
                    size="sm"
                    variant={primary ? 'default' : 'outline'}
                    disabled={isSaving}
                    onClick={() => act({ id: entry.id, action })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
