import { ERROR_TEXT, PLAN_PUBLIC_UI } from '@e-dentist/shared'
import { useState } from 'react'
import { respondToPlan } from '@/entities/plan'
import { ApiError } from '@/shared/api'
import { Button, Input, Label, Textarea } from '@/shared/ui'

interface RespondFormProps {
  code: string
  accept: boolean
  needsPhone: boolean
  onCancel(): void
  onDone(accepted: boolean): void
}

/// Bemorning javobi: rozilik yoki bosh tortish. Telefonli bemorda oxirgi
/// toʻrt raqam soʻraladi — havola tasodifan boshqa odamga tushsa, u rejani
/// koʻrsa ham javob bera olmaydi
export function RespondForm({ code, accept, needsPhone, onCancel, onDone }: RespondFormProps) {
  const [phoneTail, setPhoneTail] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function send() {
    setError('')
    setSending(true)
    try {
      await respondToPlan(code, {
        accept,
        ...(needsPhone ? { phoneTail } : {}),
        ...(accept ? {} : { reason: reason.trim() || null }),
      })
      onDone(accept)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : ERROR_TEXT.internal)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      {needsPhone && (
        <div className="space-y-1.5">
          <Label htmlFor="plan-phone">{PLAN_PUBLIC_UI.phone_label}</Label>
          <Input
            id="plan-phone"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            className="text-center text-2xl tracking-[0.4em] tabular-nums"
            value={phoneTail}
            onChange={(event) => setPhoneTail(event.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <p className="text-muted-foreground text-xs">{PLAN_PUBLIC_UI.phone_hint}</p>
        </div>
      )}

      {!accept && (
        <div className="space-y-1.5">
          <Label htmlFor="plan-reason">{PLAN_PUBLIC_UI.reason_label}</Label>
          <Textarea
            id="plan-reason"
            rows={3}
            placeholder={PLAN_PUBLIC_UI.reason_placeholder}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={sending}>
          {PLAN_PUBLIC_UI.back}
        </Button>
        <Button
          className="flex-1"
          onClick={send}
          disabled={sending || (needsPhone && phoneTail.length < 4)}
        >
          {PLAN_PUBLIC_UI.send}
        </Button>
      </div>
    </div>
  )
}
