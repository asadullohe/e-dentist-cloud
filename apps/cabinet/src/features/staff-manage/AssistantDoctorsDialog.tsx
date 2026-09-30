import { CARD_UI, STAFF_TEXT, STAFF_UI, UI_TEXT } from '@e-dentist/shared'
import { useEffect, useState } from 'react'
import type { StaffMember } from '@/entities/staff'
import { ApiError } from '@/shared/api'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'
import { DoctorPicker } from './DoctorPicker'
import { useUpdateStaff } from './hooks'

interface AssistantDoctorsDialogProps {
  person: StaffMember | null
  /// Rol assistentga almashtirilayotgan boʻlsa — shifokorlar bilan birga
  /// yuboriladi: server assistentni shifokorsiz qabul qilmaydi
  roleId?: string | undefined
  onOpenChange(open: boolean): void
}

/// Assistent kimga yordam beradi (tz.md 20-boʻlim)
export function AssistantDoctorsDialog({
  person,
  roleId,
  onOpenChange,
}: AssistantDoctorsDialogProps) {
  const { mutateAsync, isPending } = useUpdateStaff()
  const [doctorIds, setDoctorIds] = useState<string[]>([])
  const [error, setError] = useState('')
  // Yopilish animatsiyasida `person` null boʻladi — sarlavha boʻshab qolmasin
  const [shownName, setShownName] = useState('')

  useEffect(() => {
    if (person) {
      setDoctorIds(person.doctorIds)
      setShownName(person.fullName ?? '')
      setError('')
    }
  }, [person])

  async function save() {
    if (!person) return
    if (doctorIds.length === 0) {
      setError(STAFF_TEXT.doctors_required)
      return
    }
    setError('')
    try {
      await mutateAsync({ id: person.id, doctorIds, ...(roleId ? { roleId } : {}) })
      onOpenChange(false)
    } catch (caught) {
      if (caught instanceof ApiError) setError(caught.fields?.doctorIds ?? caught.message)
      else setError(UI_TEXT.offline)
    }
  }

  return (
    <Dialog open={person !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{STAFF_UI.doctors_title(shownName)}</DialogTitle>
          <DialogDescription>{STAFF_UI.doctors_hint}</DialogDescription>
        </DialogHeader>

        <DoctorPicker value={doctorIds} onChange={setDoctorIds} idPrefix="assistant-doctors" />
        {error && <p className="text-destructive text-sm font-medium">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {CARD_UI.cancel}
          </Button>
          <Button type="button" disabled={isPending} onClick={save}>
            {isPending ? UI_TEXT.loading : CARD_UI.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
