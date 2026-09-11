import {
  clinicLogoUrl,
  formatUzPhone,
  phoneDigits,
  QUEUE_UI,
  UI_TEXT,
  VALIDATION_TEXT,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  type QueueDoctor,
  useJoinQueue,
  useQueueBoard,
  useQueueStream,
  useQueueTicket,
} from '@/entities/queue'
import { ApiError } from '@/shared/api'
import { Button, Card, Input, Label, Skeleton } from '@/shared/ui'
import { Ticket } from './Ticket'

/// Olingan raqam brauzerda saqlanadi: sahifa yopilib qayta ochilsa ham
/// bemor oʻz oʻrnini koʻradi
const storageKey = (code: string) => `ed_queue_${code}`

function readTicketId(code: string): string | null {
  try {
    return localStorage.getItem(storageKey(code))
  } catch {
    // Shaxsiy rejimda localStorage yopiq boʻlishi mumkin — sahifa baribir ishlaydi
    return null
  }
}

export function Queue() {
  const { code = '' } = useParams()
  const [ticketId, setTicketId] = useState<string | null>(() => readTicketId(code))

  // Navbat oʻzgarishi darhol koʻrinsin
  useQueueStream(code)

  const board = useQueueBoard(code)
  const ticket = useQueueTicket(code, ticketId)
  const { mutateAsync: join, isPending } = useJoinQueue(code)

  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  async function submit() {
    setError('')
    if (!doctorId) return setError(QUEUE_UI.pick_doctor)
    if (fullName.trim().length < 3) return setError(VALIDATION_TEXT.fio_too_short)
    const digits = phoneDigits(phone)
    if (phone && digits.length !== 9) return setError(VALIDATION_TEXT.phone_incomplete)

    try {
      const created = await join({
        doctorId,
        fullName: fullName.trim(),
        ...(digits ? { phone: digits } : {}),
      })
      try {
        localStorage.setItem(storageKey(code), created.id)
      } catch {
        // Saqlab boʻlmasa ham raqam ekranda koʻrinadi
      }
      setTicketId(created.id)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  if (board.isPending) {
    return (
      <main className="mx-auto max-w-md p-4">
        <Skeleton className="h-40 w-full" />
      </main>
    )
  }

  if (board.isError) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <div className="text-4xl">🚪</div>
        <p className="text-destructive mt-2 font-medium">
          {board.error instanceof ApiError ? board.error.message : UI_TEXT.offline}
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md p-4 pb-10">
      {board.data?.hasLogo && (
        <img
          src={clinicLogoUrl(code)}
          alt=""
          className="mx-auto mb-2 size-16 rounded-lg object-contain"
        />
      )}
      <h1 className="font-display text-center text-xl font-bold tracking-tight">
        {board.data?.clinicName}
      </h1>
      <p className="text-muted-foreground mb-4 text-center text-sm">{QUEUE_UI.title}</p>

      {ticket.data && ticketId ? (
        <Ticket
          ticket={ticket.data}
          onLeave={() => {
            try {
              localStorage.removeItem(storageKey(code))
            } catch {
              // Tozalab boʻlmasa ham ekranda formaga qaytamiz
            }
            setTicketId(null)
          }}
        />
      ) : (
        <>
          <div className="mb-4 space-y-2">
            {board.data?.doctors.length === 0 && (
              <p className="text-muted-foreground text-center text-sm">{QUEUE_UI.no_doctors}</p>
            )}
            {board.data?.doctors.map((doctor: QueueDoctor) => (
              <button
                key={doctor.id}
                type="button"
                onClick={() => setDoctorId(doctor.id)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors',
                  doctorId === doctor.id ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                )}
              >
                <div className="font-semibold">{doctor.fullName}</div>
                <div className="text-muted-foreground text-sm">
                  {QUEUE_UI.waiting(doctor.waiting)}
                  {doctor.waiting > 0 && ` · ${QUEUE_UI.wait_minutes(doctor.waitMinutes)}`}
                </div>
              </button>
            ))}
          </div>

          {doctorId && (
            <Card className="p-4">
              <div className="space-y-1.5">
                <Label htmlFor="queue-name">{QUEUE_UI.full_name}</Label>
                <Input
                  id="queue-name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="queue-phone">{QUEUE_UI.phone}</Label>
                <Input
                  id="queue-phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(event) => setPhone(formatUzPhone(event.target.value))}
                />
              </div>

              {error && <p className="text-destructive text-sm font-medium">{error}</p>}

              <Button className="w-full" onClick={submit} disabled={isPending}>
                {isPending ? UI_TEXT.sending : QUEUE_UI.join}
              </Button>
            </Card>
          )}
        </>
      )}
    </main>
  )
}
