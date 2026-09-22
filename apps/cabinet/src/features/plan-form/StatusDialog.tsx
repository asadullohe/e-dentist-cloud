import { CARD_UI, ERROR_TEXT, PLAN_TEXT, PLAN_UI } from '@e-dentist/shared'
import { useEffect, useState } from 'react'
import type { PlanStatus } from '@/entities/plan'
import { ApiError } from '@/shared/api'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@/shared/ui'
import { useSetPlanStatus } from './hooks'

interface StatusDialogProps {
  planId: string
  /// Qaysi holatga oʻtilmoqda; boʻsh — oyna yopiq
  status: PlanStatus | null
  onClose(): void
}

/// Rad etish va bekor qilish sababsiz oʻtmaydi (server ham talab qiladi):
/// yozuv qoladi, lekin nega ekani yoʻqolsa uning qiymati ham yoʻqoladi
export function StatusDialog({ planId, status, onClose }: StatusDialogProps) {
  const { mutateAsync, isPending } = useSetPlanStatus(planId)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status) {
      setReason('')
      setError('')
    }
  }, [status])

  async function submit() {
    if (!status) return
    if (!reason.trim()) return setError(PLAN_TEXT.reason_required)
    try {
      await mutateAsync({ status, reason: reason.trim() })
      onClose()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : ERROR_TEXT.internal)
    }
  }

  return (
    <Dialog open={status !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {status === 'declined' ? PLAN_UI.decline_title : PLAN_UI.cancel_title}
          </DialogTitle>
          {status === 'cancelled' && <DialogDescription>{PLAN_UI.cancel_hint}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="plan-status-reason">{PLAN_UI.reason}</Label>
          <Textarea
            id="plan-status-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {CARD_UI.cancel}
          </Button>
          <Button
            variant={status === 'cancelled' ? 'destructive' : 'default'}
            onClick={submit}
            disabled={isPending}
          >
            {status === 'declined' ? PLAN_UI.decline : PLAN_UI.cancel_plan}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
