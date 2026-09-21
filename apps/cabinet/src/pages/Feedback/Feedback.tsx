import {
  FEEDBACK_TEXT,
  FEEDBACK_UI,
  type FeedbackTag,
  formatUzPhone,
  UI_TEXT,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { rememberFeedback, useFeedbackPage, useSubmitFeedback } from '@/entities/feedback'
import { ApiError } from '@/shared/api'
import { Button, Card, Input, Label, Skeleton, Textarea } from '@/shared/ui'
import { PublicShell } from '../Queue/PublicShell'
import { StarRating } from './StarRating'
import { TagPicker } from './TagPicker'
import { Thanks } from './Thanks'

/// Manzildan kelgan boshlangʻich holat: navbat raqami (`ticket`), oldindan
/// tanlangan shifokor (`doctor`, xona QR i), yulduz (`rating`, raqam kartasi)
function initialRating(raw: string | null): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 0
}

/// Fikr sahifasi (/f/<kod>). Bitta forma, uch kirish nuqtasi: navbat
/// raqami tugagach, fikr QR varagʻi, navbat sahifasidagi tugma
export function Feedback() {
  const { code = '' } = useParams()
  const [params] = useSearchParams()
  const ticketId = params.get('ticket')
  const fromQr = params.get('from') === 'qr' || params.has('doctor')

  const page = useFeedbackPage(code)
  const { mutateAsync: submit, isPending } = useSubmitFeedback(code)

  const [rating, setRating] = useState(() => initialRating(params.get('rating')))
  const [doctorId, setDoctorId] = useState<string | null>(params.get('doctor'))
  const [tags, setTags] = useState<FeedbackTag[]>([])
  const [comment, setComment] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState<{ rating: number; reviewUrl: string | null } | null>(null)

  if (page.isPending) {
    return (
      <main className="mx-auto max-w-md space-y-3 p-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </main>
    )
  }
  if (page.isError || !page.data) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <div className="text-4xl">🚪</div>
        <p className="text-destructive mt-2 font-medium">
          {page.error instanceof ApiError ? page.error.message : UI_TEXT.offline}
        </p>
      </main>
    )
  }

  const data = page.data

  async function send(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (rating === 0) return setError(FEEDBACK_TEXT.rating_required)
    try {
      const result = await submit({
        rating,
        tags,
        comment: comment.trim() || undefined,
        phone: phone.trim() || undefined,
        doctorId: ticketId ? null : doctorId,
        ticketId,
        source: fromQr ? 'qr' : 'page',
      })
      if (ticketId) rememberFeedback(ticketId)
      setSent({ rating: result.rating, reviewUrl: result.reviewUrl })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  return (
    <PublicShell
      code={code}
      clinicName={data.clinicName}
      hasLogo={data.hasLogo}
      title={FEEDBACK_UI.title}
      subtitle={FEEDBACK_UI.subtitle}
    >
      {sent ? (
        <Thanks
          code={code}
          rating={sent.rating}
          reviewUrl={sent.reviewUrl}
          showQueueLink={!fromQr}
        />
      ) : (
        <form onSubmit={send} className="space-y-4">
          <Card className="gap-3 p-4">
            <div className="text-center text-sm font-medium">{FEEDBACK_UI.rating}</div>
            <StarRating value={rating} onChange={setRating} />
          </Card>

          {rating > 0 && (
            <Card className="gap-5 p-4">
              {/* Navbat raqamidan kelganda shifokor maʼlum — soʻralmaydi */}
              {!ticketId && data.doctors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">{FEEDBACK_UI.doctor}</div>
                  <div className="flex flex-wrap gap-2">
                    {data.doctors.map((doctor) => (
                      <DoctorChip
                        key={doctor.id}
                        label={doctor.fullName}
                        on={doctorId === doctor.id}
                        onClick={() => setDoctorId(doctor.id)}
                      />
                    ))}
                    <DoctorChip
                      label={FEEDBACK_UI.doctor_any}
                      on={doctorId === null}
                      onClick={() => setDoctorId(null)}
                    />
                  </div>
                </div>
              )}

              <TagPicker
                label={rating >= 4 ? FEEDBACK_UI.tags_good : FEEDBACK_UI.tags_bad}
                value={tags}
                onChange={setTags}
              />

              <div className="space-y-1.5">
                <Label htmlFor="feedback-comment">{FEEDBACK_UI.comment}</Label>
                <Textarea
                  id="feedback-comment"
                  rows={3}
                  maxLength={1000}
                  placeholder={FEEDBACK_UI.comment_placeholder}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="feedback-phone">{FEEDBACK_UI.phone}</Label>
                <Input
                  id="feedback-phone"
                  inputMode="tel"
                  autoComplete="tel"
                  className="h-11"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(event) => setPhone(formatUzPhone(event.target.value))}
                />
                <p className="text-muted-foreground text-xs">{FEEDBACK_UI.phone_hint}</p>
              </div>

              {error && <p className="text-destructive text-sm font-medium">{error}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                {isPending ? UI_TEXT.sending : FEEDBACK_UI.send}
              </Button>
            </Card>
          )}
          {rating === 0 && error && (
            <p className="text-destructive text-center text-sm font-medium">{error}</p>
          )}
        </form>
      )}
    </PublicShell>
  )
}

function DoctorChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm transition-colors',
        on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent',
      )}
    >
      {label}
    </button>
  )
}
