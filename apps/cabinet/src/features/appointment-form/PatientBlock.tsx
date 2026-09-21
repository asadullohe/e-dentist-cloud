import { formatUzPhone, PATIENT_UI, SCHEDULE_UI } from '@e-dentist/shared'
import { UserPlusIcon, XIcon } from 'lucide-react'
import type { Patient } from '@/entities/patient'
import { PatientPicker } from '@/entities/patient'
import { Button, Input, Label } from '@/shared/ui'

export interface NewPatient {
  fio: string
  phone: string
}

/// Qabul formasining «Bemor» qismi: kartotekadan tanlash yoki shu yerning
/// oʻzida yangi bemor (F.I.O. + telefon). Qabulxona bemorni izlab
/// topolmasa boshqa sahifaga oʻtmaydi
export function PatientBlock({
  patientId,
  patientName,
  onPick,
  newPatient,
  onNewPatient,
  error,
}: {
  patientId: string
  patientName: string
  onPick: (id: string, fio: string, patient: Patient) => void
  /// `null` — kartotekadan tanlash rejimi
  newPatient: NewPatient | null
  onNewPatient: (value: NewPatient | null) => void
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{SCHEDULE_UI.patient}</Label>
      {newPatient === null ? (
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <PatientPicker value={patientId || null} label={patientName} onPick={onPick} />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={SCHEDULE_UI.new_patient}
            title={SCHEDULE_UI.new_patient}
            onClick={() => onNewPatient({ fio: '', phone: '' })}
          >
            <UserPlusIcon />
          </Button>
        </div>
      ) : (
        <div className="bg-muted/60 space-y-3 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{SCHEDULE_UI.new_patient}</div>
              <div className="text-muted-foreground text-xs">{SCHEDULE_UI.new_patient_hint}</div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onNewPatient(null)}
              aria-label={SCHEDULE_UI.existing_patient}
            >
              <XIcon />
              {SCHEDULE_UI.existing_patient}
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="appt-new-fio">{PATIENT_UI.fio} *</Label>
            <Input
              id="appt-new-fio"
              autoFocus
              value={newPatient.fio}
              onChange={(event) => onNewPatient({ ...newPatient, fio: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="appt-new-phone">{PATIENT_UI.phone}</Label>
            <Input
              id="appt-new-phone"
              inputMode="tel"
              placeholder="+998 90 123 45 67"
              value={newPatient.phone}
              onChange={(event) =>
                onNewPatient({ ...newPatient, phone: formatUzPhone(event.target.value) })
              }
            />
          </div>
        </div>
      )}
      {error && <p className="text-destructive text-sm font-medium">{error}</p>}
    </div>
  )
}
