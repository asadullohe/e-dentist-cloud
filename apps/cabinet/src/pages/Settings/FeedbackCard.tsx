import {
  FEEDBACK_CABINET_UI,
  FEEDBACK_SOURCE_LABELS,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_TAG_LABELS,
  FEEDBACK_UI,
  formatDateTime,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { CheckIcon, PhoneIcon, StarIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { type Feedback, useSetFeedbackStatus } from '@/entities/feedback'
import { Badge, Button, Card } from '@/shared/ui'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={FEEDBACK_UI.rating_labels[rating - 1]}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          className={cn('size-4', n <= rating ? 'text-warn' : 'text-muted-foreground/30')}
          fill={n <= rating ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

/// Bitta fikr: baho, kim haqida, qachon, teglar, izoh, telefon, holat.
/// Past baho (1–2) chap chegarasi qizil — egasi darrov koʻrsin
export function FeedbackCard({ item, canManage }: { item: Feedback; canManage: boolean }) {
  const { mutate: setStatus, isPending } = useSetFeedbackStatus()
  const low = item.rating <= 2

  return (
    <Card className={cn('gap-3 p-4', low && 'border-l-destructive border-l-4')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Stars rating={item.rating} />
            <span className="text-sm font-medium">
              {FEEDBACK_UI.rating_labels[item.rating - 1]}
            </span>
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {item.doctorName ?? FEEDBACK_CABINET_UI.no_doctor} · {formatDateTime(item.createdAt)} ·{' '}
            {FEEDBACK_SOURCE_LABELS[item.source]}
          </div>
        </div>
        <Badge variant={item.status === 'new' ? 'default' : 'secondary'}>
          {FEEDBACK_STATUS_LABELS[item.status]}
        </Badge>
      </div>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {FEEDBACK_TAG_LABELS[tag]}
            </Badge>
          ))}
        </div>
      )}

      {item.comment && <p className="text-sm whitespace-pre-line">{item.comment}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {item.phone && (
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${item.phone.replace(/[^+\d]/g, '')}`}>
              <PhoneIcon />
              {item.phone}
            </a>
          </Button>
        )}
        {item.patientId && (
          <Button asChild variant="ghost" size="sm">
            <Link to={`/patients/${item.patientId}`}>{FEEDBACK_CABINET_UI.patient_card}</Link>
          </Button>
        )}
        {canManage && item.status === 'new' && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => setStatus({ id: item.id, status: 'seen' })}
          >
            <CheckIcon />
            {FEEDBACK_CABINET_UI.mark_seen}
          </Button>
        )}
        {canManage && item.status !== 'contacted' && (item.phone || item.patientId) && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => setStatus({ id: item.id, status: 'contacted' })}
          >
            <PhoneIcon />
            {FEEDBACK_CABINET_UI.mark_contacted}
          </Button>
        )}
      </div>
    </Card>
  )
}
