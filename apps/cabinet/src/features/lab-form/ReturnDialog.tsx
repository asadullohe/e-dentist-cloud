import { CARD_UI, LAB_RETURN_REASON_LABELS, LAB_UI, UI_TEXT } from '@e-dentist/shared'
import { useEffect, useState } from 'react'
import type { LabOrder, LabReturnReason } from '@/entities/lab-order'
import { ApiError } from '@/shared/api'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/shared/ui'
import { useReturnLabOrder } from './hooks'

const REASONS = Object.keys(LAB_RETURN_REASON_LABELS) as LabReturnReason[]

interface ReturnDialogProps {
  order: LabOrder | null
  onOpenChange(open: boolean): void
}

export function ReturnDialog({ order, onOpenChange }: ReturnDialogProps) {
  const { mutateAsync, isPending } = useReturnLabOrder()
  const [reason, setReason] = useState<LabReturnReason>('fit')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (order) {
      setReason('fit')
      setNote('')
      setError('')
    }
  }, [order])

  async function save() {
    if (!order) return
    setError('')
    try {
      await mutateAsync({ id: order.id, reason, note: note || null })
      onOpenChange(false)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  return (
    <Dialog open={order !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{LAB_UI.return_title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="return-reason">{LAB_UI.return_reason}</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as LabReturnReason)}>
              <SelectTrigger id="return-reason" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {LAB_RETURN_REASON_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="return-note">{LAB_UI.return_note}</Label>
            <Textarea
              id="return-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm font-medium">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {CARD_UI.cancel}
          </Button>
          <Button type="button" onClick={save} disabled={isPending}>
            {isPending ? UI_TEXT.loading : LAB_UI.mark_returned}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
