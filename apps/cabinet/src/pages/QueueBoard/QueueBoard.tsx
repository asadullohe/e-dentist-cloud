import { formatUzPhone, QUEUE_CABINET_UI, QUEUE_STATUS_LABELS } from '@e-dentist/shared'
import { cn } from 'cn'
import { BellIcon, ExternalLinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { type QueueEntry, type QueueStatus, useQueueStream } from '@/entities/queue'
import { useSession } from '@/entities/session'
import { type QueueAction, useQueue, useQueueAction } from '@/features/queue-manage'
import { Badge, Button, Card, EmptyState, Skeleton } from '@/shared/ui'

/// Taxta ustunlari — navbat oqimi tartibida
const COLUMNS: QueueStatus[] = ['unconfirmed', 'waiting', 'called', 'finished']

interface Action {
  action: QueueAction
  label: string
  primary?: boolean
}

/// Har holatda qaysi tugmalar koʻrinadi. Server ham shu oqimni tekshiradi.
/// Funksiya, konstanta emas — matnlar joriy tilda oʻqilishi uchun
function actionsFor(status: QueueStatus): Action[] {
  switch (status) {
    case 'unconfirmed':
      return [{ action: 'confirm', label: QUEUE_CABINET_UI.confirm, primary: true }]
    case 'waiting':
      return [
        { action: 'call', label: QUEUE_CABINET_UI.call, primary: true },
        { action: 'no_show', label: QUEUE_CABINET_UI.no_show },
      ]
    case 'called':
      return [
        { action: 'done', label: QUEUE_CABINET_UI.done, primary: true },
        { action: 'arrived', label: QUEUE_CABINET_UI.arrived },
        { action: 'no_show', label: QUEUE_CABINET_UI.no_show },
      ]
    default:
      return []
  }
}

/// Ustun rangi: chaqirilgan — yashil, tasdiqlanmagan — sariq
function columnTone(status: QueueStatus): string {
  if (status === 'called') return 'bg-ok/10 text-ok'
  if (status === 'unconfirmed') return 'bg-warn/15'
  return 'bg-muted'
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })

interface TicketProps {
  entry: QueueEntry
  busy: boolean
  onAct: (id: string, action: QueueAction) => void
}

function Ticket({ entry, busy, onAct }: TicketProps) {
  const actions = actionsFor(entry.status)

  return (
    <Card
      className={cn(
        'gap-2 p-3',
        entry.status === 'called' && 'border-ok/40',
        entry.status === 'finished' && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl font-semibold tabular-nums">{entry.number}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">
            {entry.patientId ? (
              <Link to={`/patients/${entry.patientId}`} className="hover:underline">
                {entry.fio}
              </Link>
            ) : (
              entry.fio
            )}
          </div>
          {entry.phone && (
            <div className="text-muted-foreground text-xs">{formatUzPhone(entry.phone)}</div>
          )}
          <div className="text-muted-foreground text-xs">
            {entry.doctorName} · {timeOf(entry.at)}
          </div>
          {entry.patientId === null && (
            <Badge variant="outline" className="mt-1 text-[11px]">
              {QUEUE_CABINET_UI.new_patient}
            </Badge>
          )}
        </div>
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {actions.map(({ action, label, primary }) => (
            <Button
              key={action}
              size="sm"
              variant={primary ? 'default' : 'outline'}
              disabled={busy}
              onClick={() => onAct(entry.id, action)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
    </Card>
  )
}

export function QueueBoard() {
  const { data: session } = useSession()
  const { data: entries, isPending } = useQueue()
  const { mutate: act, isPending: isSaving } = useQueueAction()

  // Boshqa xodim navbatni oʻzgartirsa roʻyxat oʻzi yangilanadi
  const code = session?.clinic?.queueCode ?? ''
  useQueueStream(code)

  const byStatus = new Map<QueueStatus, QueueEntry[]>()
  for (const entry of entries ?? []) {
    byStatus.set(entry.status, [...(byStatus.get(entry.status) ?? []), entry])
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{QUEUE_CABINET_UI.title}</h1>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((status) => (
            <Skeleton key={status} className="h-40 w-full" />
          ))}
        </div>
      ) : entries?.length === 0 ? (
        <Card className="py-0">
          <EmptyState icon={BellIcon} text={QUEUE_CABINET_UI.empty} />
        </Card>
      ) : (
        // Taxta: har holat oʻz ustunida, telefonda ustunlar ketma-ket
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((status) => {
            const items = byStatus.get(status) ?? []
            return (
              <section key={status} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-medium">{QUEUE_STATUS_LABELS[status]}</h2>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                      columnTone(status),
                    )}
                  >
                    {items.length}
                  </span>
                </div>
                {items.length === 0 ? (
                  <div className="text-muted-foreground rounded-md border border-dashed py-6 text-center text-xs">
                    {QUEUE_CABINET_UI.empty_column}
                  </div>
                ) : (
                  items.map((entry) => (
                    <Ticket
                      key={entry.id}
                      entry={entry}
                      busy={isSaving}
                      onAct={(id, action) => act({ id, action })}
                    />
                  ))
                )}
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
