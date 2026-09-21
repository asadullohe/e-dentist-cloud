import { formatUzPhone, phoneDigits, QUEUE_UI, UI_TEXT, VALIDATION_TEXT } from '@e-dentist/shared'
import { useState } from 'react'
import { type QueueDoctor, useJoinQueue } from '@/entities/queue'
import { ApiError } from '@/shared/api'
import { Button, Card, Input, Label } from '@/shared/ui'

/// 2-qadam: ism va telefon. Tanlangan shifokor tepada, «boshqa shifokor»
/// birinchi qadamga qaytaradi
export function JoinForm({
  code,
  doctor,
  onBack,
  onJoined,
}: {
  code: string
  doctor: QueueDoctor
  onBack: () => void
  onJoined: (ticketId: string) => void
}) {
  const { mutateAsync: join, isPending } = useJoinQueue(code)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (fullName.trim().length < 3) return setError(VALIDATION_TEXT.fio_too_short)
    const digits = phoneDigits(phone)
    if (phone && digits.length !== 9) return setError(VALIDATION_TEXT.phone_incomplete)

    try {
      const created = await join({
        doctorId: doctor.id,
        fullName: fullName.trim(),
        ...(digits ? { phone: digits } : {}),
      })
      onJoined(created.id)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="bg-primary/5 border-primary/30 flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-semibold">{doctor.fullName}</div>
          <div className="text-muted-foreground text-xs">
            {QUEUE_UI.waiting(doctor.waiting)}
            {doctor.waiting > 0 && ` · ${QUEUE_UI.wait_minutes(doctor.waitMinutes)}`}
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          {QUEUE_UI.change_doctor}
        </Button>
      </div>

      <Card className="gap-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="queue-name">{QUEUE_UI.full_name}</Label>
          <Input
            id="queue-name"
            autoComplete="name"
            autoFocus
            className="h-11"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="queue-phone">{QUEUE_UI.phone_optional}</Label>
          <Input
            id="queue-phone"
            inputMode="tel"
            autoComplete="tel"
            className="h-11"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(event) => setPhone(formatUzPhone(event.target.value))}
          />
          <p className="text-muted-foreground text-xs">{QUEUE_UI.phone_hint}</p>
        </div>

        {error && <p className="text-destructive text-sm font-medium">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? UI_TEXT.sending : QUEUE_UI.join}
        </Button>
      </Card>
    </form>
  )
}
