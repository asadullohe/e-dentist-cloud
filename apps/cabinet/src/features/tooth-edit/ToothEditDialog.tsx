import { CARD_UI, UI_TEXT } from '@e-dentist/shared'
import {
  CROWN_MATERIALS,
  crownMaterialLabel,
  isCrowned,
  TOOTH_STATUSES,
  toothStatusLabel,
} from '@e-dentist/teeth'
import { useEffect, useState } from 'react'
import type { ToothInfo } from '@/entities/tooth'
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
import { useSetTooth } from './hooks'

interface ToothEditDialogProps {
  patientId: string
  /// Boʻsh boʻlsa oyna yopiq
  tooth: number | null
  current: ToothInfo | undefined
  onClose(): void
}

export function ToothEditDialog({ patientId, tooth, current, onClose }: ToothEditDialogProps) {
  const { mutateAsync, isPending } = useSetTooth(patientId)
  const [status, setStatus] = useState('soglom')
  const [material, setMaterial] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (tooth === null) return
    setStatus(current?.status ?? 'soglom')
    setMaterial(current?.material ?? '')
    setNote(current?.note ?? '')
  }, [tooth, current])

  async function save() {
    if (tooth === null) return
    await mutateAsync({
      tooth,
      payload: {
        status,
        // Material faqat koronka va koʻprikda maʼnoli
        material: isCrowned(status) ? material : '',
        note: note || null,
      },
    })
    onClose()
  }

  return (
    <Dialog open={tooth !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{tooth === null ? '' : CARD_UI.tooth_title(tooth)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="tooth-status">{CARD_UI.status}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="tooth-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOOTH_STATUSES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {toothStatusLabel(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCrowned(status) && (
            <div className="space-y-1.5">
              <Label htmlFor="tooth-material">{CARD_UI.material}</Label>
              <Select value={material} onValueChange={setMaterial}>
                <SelectTrigger id="tooth-material" className="w-full">
                  <SelectValue placeholder={crownMaterialLabel('')} />
                </SelectTrigger>
                <SelectContent>
                  {CROWN_MATERIALS.map((key) => (
                    <SelectItem key={key || 'none'} value={key}>
                      {crownMaterialLabel(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tooth-note">{CARD_UI.note}</Label>
            <Textarea
              id="tooth-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {CARD_UI.cancel}
          </Button>
          <Button type="button" onClick={save} disabled={isPending}>
            {isPending ? UI_TEXT.loading : CARD_UI.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
