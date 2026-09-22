import { CARD_UI, PLAN_TEXT, PLAN_UI } from '@e-dentist/shared'
import { useEffect, useState } from 'react'
import type { PlanStageDraft } from '@/entities/plan'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@/shared/ui'

interface StageFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  stage?: { id?: string; name: string; note: string | null } | undefined
  onSave(stage: Pick<PlanStageDraft, 'id' | 'name' | 'note'>): void
}

/// Bosqich: «1-bosqich: davolash», «Protez». Ichidagi ishlar sahifada
/// tahrirlanadi — bu yerda faqat nomi va izohi
export function StageFormDialog({ open, onOpenChange, stage, onSave }: StageFormDialogProps) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setName(stage?.name ?? '')
    setNote(stage?.note ?? '')
  }, [open, stage])

  function save() {
    const value = name.trim()
    if (!value) return setError(PLAN_TEXT.stage_name_required)
    onSave({ ...(stage?.id ? { id: stage.id } : {}), name: value, note: note.trim() || null })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{stage ? PLAN_UI.stage_edit : PLAN_UI.stage_new}</DialogTitle>
          <DialogDescription>{PLAN_UI.stage_name_hint}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="plan-stage-name">{PLAN_UI.stage_name}</Label>
            <Input
              id="plan-stage-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-stage-note">{PLAN_UI.note}</Label>
            <Textarea
              id="plan-stage-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {CARD_UI.cancel}
          </Button>
          <Button onClick={save}>{CARD_UI.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
