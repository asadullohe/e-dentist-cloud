import { CARD_UI, QUEUE_CABINET_UI, QUEUE_TEXT, UI_TEXT } from '@e-dentist/shared'
import { useEffect, useState } from 'react'
import { useDoctors } from '@/entities/staff'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import { useEnqueue } from './hooks'

interface EnqueueDialogProps {
  /// Boʻsh — oyna yopiq
  patient: { id: string; fio: string; doctorId: string | null } | null
  onClose(): void
}

/// Mavjud bemorni bugungi navbatga qoʻshish: shifokor — sukut bemorning
/// biriktirilgani, oʻzgartirish mumkin (10.3)
export function EnqueueDialog({ patient, onClose }: EnqueueDialogProps) {
  const { data: doctors } = useDoctors()
  const { mutateAsync, isPending } = useEnqueue()
  const [doctorId, setDoctorId] = useState('')
  const [error, setError] = useState('')

  const open = patient !== null
  const preset = patient?.doctorId ?? ''
  useEffect(() => {
    if (open) {
      setDoctorId(preset)
      setError('')
    }
  }, [open, preset])

  async function submit() {
    if (!patient) return
    if (!doctorId) return setError(QUEUE_TEXT.doctor_required)
    setError('')
    try {
      await mutateAsync({ patientId: patient.id, doctorId })
      onClose()
    } catch {
      // Server xatosi (masalan «allaqachon navbatda») — toastda
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{patient && QUEUE_CABINET_UI.enqueue_title(patient.fio)}</DialogTitle>
          <DialogDescription>{QUEUE_CABINET_UI.enqueue_hint}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="enqueue-doctor">{QUEUE_CABINET_UI.doctor}</Label>
          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger id="enqueue-doctor" className="w-full">
              <SelectValue placeholder={QUEUE_TEXT.doctor_required} />
            </SelectTrigger>
            <SelectContent>
              {doctors?.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-destructive text-sm font-medium">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {CARD_UI.cancel}
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? UI_TEXT.loading : QUEUE_CABINET_UI.enqueue}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
