import {
  APPOINTMENT_STATUS_LABELS,
  CARD_UI,
  formatDate,
  parseDisplayDate,
  SCHEDULE_UI,
  UI_TEXT,
} from '@e-dentist/shared'
import { useEffect, useState } from 'react'
import type { Appointment, AppointmentStatus } from '@/entities/appointment'
import { PatientPicker } from '@/entities/patient'
import { useDoctors } from '@/entities/staff'
import { ApiError } from '@/shared/api'
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/shared/ui'
import { useSaveAppointment } from './hooks'

/// Radix Select boʻsh satrni qabul qilmaydi — «shifokorsiz» uchun belgi
const NO_DOCTOR = '__none__'

interface AppointmentFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  /// Boʻsh boʻlsa — yangi qabul. Kalendarda bosilgan kun shu yerga keladi
  defaultDate: string
  appointment?: Appointment | undefined
}

function localTime(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  defaultDate,
  appointment,
}: AppointmentFormDialogProps) {
  const { mutateAsync, isPending } = useSaveAppointment(appointment?.id ?? null)

  const [patientId, setPatientId] = useState<string | null>(null)
  const [patientName, setPatientName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [status, setStatus] = useState<AppointmentStatus>('scheduled')
  const [note, setNote] = useState('')
  // Boʻsh — shifokorsiz. Bemor tanlanganda uning biriktirilgan shifokori
  // qoʻyiladi, keyin qoʻlda oʻzgartirish mumkin (shifokor taʼtilda)
  const [doctorId, setDoctorId] = useState('')
  const [error, setError] = useState('')
  const { data: doctors } = useDoctors()

  useEffect(() => {
    if (!open) return
    setError('')
    if (appointment) {
      setPatientId(appointment.patientId)
      setPatientName(appointment.fio)
      setDate(formatDate(appointment.at.slice(0, 10)))
      setTime(localTime(appointment.at))
      setStatus(appointment.status)
      setNote(appointment.note ?? '')
      setDoctorId(appointment.doctorId ?? '')
    } else {
      setPatientId(null)
      setPatientName('')
      setDate(formatDate(defaultDate))
      setTime('')
      setStatus('scheduled')
      setNote('')
      setDoctorId('')
    }
  }, [open, appointment, defaultDate])

  async function save() {
    setError('')
    const iso = parseDisplayDate(date)
    if (!iso) return setError(SCHEDULE_UI.date_unreadable)
    if (!appointment && !patientId) return setError(SCHEDULE_UI.pick_patient)

    try {
      await mutateAsync({
        ...(appointment ? { status } : { patientId: patientId as string }),
        doctorId: doctorId || null,
        date: iso,
        time,
        note: note || null,
      })
      onOpenChange(false)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{appointment ? SCHEDULE_UI.edit : SCHEDULE_UI.add}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          {!appointment && (
            <div className="space-y-1.5">
              <Label>{SCHEDULE_UI.patient}</Label>
              <PatientPicker
                value={patientId}
                label={patientName}
                onPick={(id, fio, patient) => {
                  setPatientId(id)
                  setPatientName(fio)
                  setDoctorId(patient.doctorId ?? '')
                }}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="appointment-doctor">{SCHEDULE_UI.doctor}</Label>
            <Select
              value={doctorId || NO_DOCTOR}
              onValueChange={(value) => setDoctorId(value === NO_DOCTOR ? '' : value)}
            >
              <SelectTrigger id="appointment-doctor" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DOCTOR}>{SCHEDULE_UI.doctor_none}</SelectItem>
                {doctors?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="appointment-date">{SCHEDULE_UI.date}</Label>
              <DatePicker id="appointment-date" value={date} onChange={setDate} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appointment-time">{SCHEDULE_UI.time}</Label>
              <Input
                id="appointment-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>

          {appointment && (
            <div className="space-y-1.5">
              <Label htmlFor="appointment-status">{SCHEDULE_UI.status}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
                <SelectTrigger id="appointment-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="appointment-note">{SCHEDULE_UI.note}</Label>
            <Textarea
              id="appointment-note"
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
            {isPending ? UI_TEXT.loading : CARD_UI.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
