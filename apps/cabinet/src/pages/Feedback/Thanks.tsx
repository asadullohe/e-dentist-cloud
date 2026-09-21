import { FEEDBACK_UI } from '@e-dentist/shared'
import { ExternalLinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Card } from '@/shared/ui'

/// Yuborilgandan keyin: rahmat; 4–5 yulduz va sharh havolasi boʻlsa —
/// «xaritada ham baholang». Past baho — kechirim
export function Thanks({
  code,
  rating,
  reviewUrl,
  showQueueLink,
}: {
  code: string
  rating: number
  reviewUrl: string | null
  showQueueLink: boolean
}) {
  const happy = rating >= 4
  return (
    <Card className="items-center gap-3 p-6 text-center">
      <div className="text-5xl" aria-hidden="true">
        {happy ? '🙏' : '🤝'}
      </div>
      <h2 className="text-xl font-bold">{FEEDBACK_UI.thanks}</h2>
      <p className="text-muted-foreground text-sm">
        {rating <= 2 ? FEEDBACK_UI.thanks_low : FEEDBACK_UI.thanks_hint}
      </p>

      {happy && reviewUrl && (
        <div className="mt-2 w-full space-y-2">
          <p className="text-muted-foreground text-xs">{FEEDBACK_UI.review_hint}</p>
          <Button asChild size="lg" className="w-full">
            <a href={reviewUrl} target="_blank" rel="noreferrer">
              <ExternalLinkIcon />
              {FEEDBACK_UI.review_cta}
            </a>
          </Button>
        </div>
      )}

      {showQueueLink && (
        <Button asChild variant="ghost" className="text-muted-foreground">
          <Link to={`/n/${code}`}>{FEEDBACK_UI.back_to_queue}</Link>
        </Button>
      )}
    </Card>
  )
}
