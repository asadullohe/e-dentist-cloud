import { FEEDBACK_CABINET_UI, HOME_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { ArrowRightIcon, MessageSquareIcon, StarIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFeedbackSummary } from '@/entities/feedback'
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Skeleton } from '@/shared/ui'

/// Bosh sahifa: shu oyning oʻrtacha bahosi, fikrlar soni, yangilari va
/// shifokorlar boʻyicha (eng koʻp fikr olgan uchtasi)
export function FeedbackWidget({ month, className }: { month: string; className?: string }) {
  const { data, isPending } = useFeedbackSummary(month)
  const top = data?.byDoctor.filter((row) => row.doctorId !== null).slice(0, 3) ?? []

  return (
    <Card className={cn('gap-3', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{FEEDBACK_CABINET_UI.home_title}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings/fikrlar">
            {HOME_UI.all_debtors}
            <ArrowRightIcon />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isPending || !data ? (
          <Skeleton className="h-16 w-full" />
        ) : data.count === 0 ? (
          <EmptyState icon={MessageSquareIcon} text={FEEDBACK_CABINET_UI.home_empty} />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <StarIcon className="text-warn size-7" fill="currentColor" aria-hidden="true" />
                <span className="text-3xl font-bold tabular-nums">{data.average}</span>
              </div>
              <div className="text-muted-foreground text-sm">
                {FEEDBACK_CABINET_UI.home_hint(data.count, data.newCount)}
              </div>
            </div>
            {top.length > 0 && (
              <ul className="divide-y">
                {top.map((row) => (
                  <li key={row.doctorId} className="flex items-center justify-between py-1.5">
                    <span className="truncate text-sm">{row.doctorName}</span>
                    <span className="flex shrink-0 items-center gap-1 text-sm tabular-nums">
                      <StarIcon className="text-warn size-3.5" fill="currentColor" aria-hidden />
                      {row.average}
                      <span className="text-muted-foreground">({row.count})</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
