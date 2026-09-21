import { FEEDBACK_CABINET_UI, type FeedbackStatus, TABLE_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MessageSquareIcon,
  PrinterIcon,
  StarIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFeedbackList, useFeedbackSummary } from '@/entities/feedback'
import { useHasPermission } from '@/entities/session'
import { useDoctors } from '@/entities/staff'
import { PublicProfileCard } from '@/features/clinic-public'
import {
  Button,
  Card,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@/shared/ui'
import { FeedbackCard } from './FeedbackCard'

type View = 'all' | 'new' | 'low'
const PAGE_SIZE = 20
/// Radix Select boʻsh satrni qabul qilmaydi
const ALL = '__all__'

/// Sozlamalar → Fikrlar: jamlanma, filtr, roʻyxat. Egasiga qoʻshimcha —
/// bemor sahifasi kontaktlari va fikr QR varagʻi
export function FeedbackTab() {
  const hasPermission = useHasPermission()
  const canManage = hasPermission('feedback.read')
  const canSettings = hasPermission('staff.manage')

  const [view, setView] = useState<View>('all')
  const [doctorId, setDoctorId] = useState<string>(ALL)
  const [page, setPage] = useState(1)

  const filter = {
    status: view === 'new' ? ('new' as FeedbackStatus) : undefined,
    low: view === 'low' || undefined,
    doctorId: doctorId === ALL ? undefined : doctorId,
    page,
    pageSize: PAGE_SIZE,
  }
  const list = useFeedbackList(filter)
  const summary = useFeedbackSummary()
  const { data: doctors } = useDoctors()

  const total = list.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function pick(next: View) {
    setView(next)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Jamlanma: oʻrtacha baho, soni, yangilari */}
      <Card className="flex-row items-center gap-4 px-4 py-3 sm:gap-6">
        {summary.data ? (
          <>
            <div className="flex items-center gap-1.5">
              <StarIcon className="text-warn size-6" fill="currentColor" aria-hidden="true" />
              <span className="text-2xl font-bold tabular-nums">{summary.data.average ?? '—'}</span>
            </div>
            <div className="text-muted-foreground text-sm">
              {FEEDBACK_CABINET_UI.count(summary.data.count)}
              {summary.data.newCount > 0 && (
                <span className="text-primary">
                  {' '}
                  · {FEEDBACK_CABINET_UI.new_count(summary.data.newCount)}
                </span>
              )}
            </div>
          </>
        ) : (
          <Skeleton className="h-8 w-40" />
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <div className="bg-muted flex rounded-md p-0.5">
          {(
            [
              ['all', FEEDBACK_CABINET_UI.all],
              ['new', FEEDBACK_CABINET_UI.only_new],
              ['low', FEEDBACK_CABINET_UI.low_only],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => pick(key)}
              className={cn(
                'rounded px-3 py-1.5 text-sm transition-colors',
                view === key ? 'bg-background shadow-xs' : 'text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {canManage && doctors && doctors.length > 0 && (
          <Select
            value={doctorId}
            onValueChange={(value) => {
              setDoctorId(value)
              setPage(1)
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-48"
              aria-label={FEEDBACK_CABINET_UI.doctor_filter}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{TABLE_UI.filter_all}</SelectItem>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {list.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : list.data && list.data.items.length > 0 ? (
        <div className={cn('space-y-3', list.isFetching && 'opacity-60')}>
          {list.data.items.map((item) => (
            <FeedbackCard key={item.id} item={item} canManage={canManage} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={MessageSquareIcon}
            text={view === 'all' ? FEEDBACK_CABINET_UI.empty : FEEDBACK_CABINET_UI.nothing_found}
          />
          {view === 'all' && canSettings && (
            <p className="text-muted-foreground -mt-6 px-5 pb-6 text-center text-xs">
              {FEEDBACK_CABINET_UI.empty_hint}
            </p>
          )}
        </Card>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={TABLE_UI.prev_page}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="text-sm tabular-nums">{TABLE_UI.page_of(page, pages)}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label={TABLE_UI.next_page}
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      )}

      {canSettings && (
        <>
          <PublicProfileCard />
          <Card className="flex-row items-center justify-between gap-3 px-4 py-3">
            <div>
              <div className="font-medium">{FEEDBACK_CABINET_UI.poster}</div>
              <p className="text-muted-foreground text-xs">{FEEDBACK_CABINET_UI.poster_hint}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/fikr-varaq">
                <PrinterIcon />
                {FEEDBACK_CABINET_UI.poster_print}
              </Link>
            </Button>
          </Card>
        </>
      )}
    </div>
  )
}
