import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TEXT,
  CARD_UI,
  formatDate,
  parseDisplayDate,
  phoneDigits,
  SCHEDULE_UI,
  UI_TEXT,
  VALIDATION_TEXT,
} from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDownIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Appointment, AppointmentStatus } from '@/entities/appointment'
import { useDoctors } from '@/entities/staff'
import { applyServerErrors } from '@/shared/lib'
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  TimePicker,
} from '@/shared/ui'
import { useCreatePatientInline, useSaveAppointment } from './hooks'
import { type NewPatient, PatientBlock } from './PatientBlock'
import { SlotGrid } from './SlotGrid'
import { DURATIONS, localTime, minutesOf, timeOfMinutes } from './slots'

/// Radix Select boʻsh satrni qabul qilmaydi — «shifokorsiz» uchun belgi
const NO_DOCTOR = '__none__'
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/// Maydon nomlari server sxemasi bilan bir xil — serverdan kelgan xato
/// (`fields.time`) toʻgʻri maydon ostiga tushadi (applyServerErrors)
const schema = z.object({
  patientId: z.string(),
  /// Boʻsh — shifokorsiz
  doctorId: z.string(),
  date: z
    .string()
    .trim()
    .min(1, { error: () => VALIDATION_TEXT.date_invalid })
    .refine((value) => parseDisplayDate(value) !== null, {
      error: () => VALIDATION_TEXT.date_invalid,
    }),
  time: z
    .string()
    .trim()
    .min(1, { error: () => APPOINTMENT_TEXT.time_required })
    .regex(TIME, { error: () => APPOINTMENT_TEXT.time_invalid }),
  duration: z.number().int(),
  status: z.enum(['scheduled', 'arrived', 'no_show', 'done', 'cancelled']),
  note: z.string().trim().max(500),
})

type Values = z.infer<typeof schema>

interface AppointmentFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  /// Boʻsh boʻlsa — yangi qabul. Kalendarda bosilgan kun shu yerga keladi
  defaultDate: string
  /// Vaqt toʻrida bosilgan katak — «SS:DD»
  defaultTime?: string
  defaultDoctorId?: string
  appointment?: Appointment | undefined
  /// `schedule.all` yoʻq (shifokor): qabul doim oʻziga yoziladi — shifokor
  /// tanlovi koʻrsatilmaydi, server oʻzi qoʻyadi (10.7)
  ownOnly?: boolean
  /// Saqlangan qabul — sahifa kalendarni oʻsha kunga oʻtkazadi
  onSaved?(appointment: Appointment): void
}

function toValues(
  appointment: Appointment | undefined,
  defaults: { date: string; time?: string; doctorId?: string },
): Values {
  if (!appointment) {
    return {
      patientId: '',
      doctorId: defaults.doctorId ?? '',
      date: formatDate(defaults.date),
      time: defaults.time ?? '',
      duration: 30,
      status: 'scheduled',
      note: '',
    }
  }
  return {
    patientId: appointment.patientId,
    doctorId: appointment.doctorId ?? '',
    date: formatDate(appointment.at.slice(0, 10)),
    time: localTime(appointment.at),
    duration: appointment.duration,
    status: appointment.status,
    note: appointment.note ?? '',
  }
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultTime,
  defaultDoctorId,
  appointment,
  ownOnly = false,
  onSaved,
}: AppointmentFormDialogProps) {
  const { mutateAsync, isPending } = useSaveAppointment(appointment?.id ?? null)
  const createPatient = useCreatePatientInline()
  const { data: doctors } = useDoctors()
  const [patientName, setPatientName] = useState('')
  const [newPatient, setNewPatient] = useState<NewPatient | null>(null)
  const [patientError, setPatientError] = useState('')
  const [slotsOpen, setSlotsOpen] = useState(false)
  const [formError, setFormError] = useState('')

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(appointment, { date: defaultDate }),
  })

  useEffect(() => {
    if (open) {
      form.reset(
        toValues(appointment, { date: defaultDate, time: defaultTime, doctorId: defaultDoctorId }),
      )
      setPatientName(appointment?.fio ?? '')
      setNewPatient(null)
      setPatientError('')
      setSlotsOpen(false)
      setFormError('')
    }
  }, [open, appointment, defaultDate, defaultTime, defaultDoctorId, form])

  const [date, time, duration, doctorId] = form.watch(['date', 'time', 'duration', 'doctorId'])
  const isoDate = parseDisplayDate(date)
  const endTime = TIME.test(time) ? timeOfMinutes(minutesOf(time) + duration) : ''

  async function onSubmit(values: Values) {
    setFormError('')
    setPatientError('')
    try {
      let patientId = values.patientId
      if (!appointment && newPatient) {
        if (newPatient.fio.trim().length < 3) return setPatientError(VALIDATION_TEXT.fio_too_short)
        const digits = phoneDigits(newPatient.phone)
        if (newPatient.phone && digits.length !== 9)
          return setPatientError(VALIDATION_TEXT.phone_incomplete)
        // Avval kartoteka, keyin qabul — ikki soʻrov; bemor yaratilib qabul
        // yozilmay qolsa kartotekada qoladi, bu zarar emas
        const created = await createPatient.mutateAsync({
          fio: newPatient.fio.trim(),
          ...(digits ? { phone: digits } : {}),
          ...(values.doctorId ? { doctorId: values.doctorId } : {}),
        })
        patientId = created.id
      }
      if (!appointment && !patientId) return setPatientError(APPOINTMENT_TEXT.patient_required)

      const saved = await mutateAsync({
        ...(appointment ? { status: values.status } : { patientId }),
        ...(ownOnly ? {} : { doctorId: values.doctorId || null }),
        date: parseDisplayDate(values.date) as string,
        time: values.time,
        duration: values.duration,
        note: values.note || null,
      })
      onOpenChange(false)
      onSaved?.(saved)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{appointment ? SCHEDULE_UI.edit : SCHEDULE_UI.add}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            {!appointment && (
              <PatientBlock
                patientId={form.watch('patientId')}
                patientName={patientName}
                newPatient={newPatient}
                onNewPatient={(value) => {
                  setNewPatient(value)
                  setPatientError('')
                }}
                error={patientError}
                onPick={(id, fio, patient) => {
                  form.setValue('patientId', id)
                  setPatientName(fio)
                  // Bemorning biriktirilgan shifokori — sukut (10.2)
                  if (!ownOnly && patient.doctorId) form.setValue('doctorId', patient.doctorId)
                  setPatientError('')
                }}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{SCHEDULE_UI.date}</FormLabel>
                    <FormControl>
                      <DatePicker {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!ownOnly && (
                <FormField
                  control={form.control}
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{SCHEDULE_UI.doctor}</FormLabel>
                      <Select
                        value={field.value || NO_DOCTOR}
                        onValueChange={(value) => field.onChange(value === NO_DOCTOR ? '' : value)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_DOCTOR}>{SCHEDULE_UI.doctor_none}</SelectItem>
                          {doctors?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Boshlanish · davomiylik → tugash */}
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{SCHEDULE_UI.time}</FormLabel>
                    <FormControl>
                      <TimePicker {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{SCHEDULE_UI.duration}</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DURATIONS.map((minutes) => (
                          <SelectItem key={minutes} value={String(minutes)}>
                            {SCHEDULE_UI.minutes(minutes)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-muted-foreground h-9 whitespace-nowrap pb-2 text-sm font-medium tabular-nums">
                {endTime && SCHEDULE_UI.ends_at(endTime)}
              </div>
            </div>

            {/* Boʻsh vaqtlar — yigʻilgan; ochilganda kun va shifokor boʻyicha toʻr */}
            <div className="space-y-2">
              <button
                type="button"
                className="text-primary flex items-center gap-1 text-sm font-medium"
                aria-expanded={slotsOpen}
                onClick={() => setSlotsOpen((v) => !v)}
              >
                <ChevronDownIcon
                  className={`size-4 transition-transform ${slotsOpen ? 'rotate-180' : ''}`}
                />
                {SCHEDULE_UI.free_slots}
              </button>
              {slotsOpen && isoDate && (
                <SlotGrid
                  date={isoDate}
                  doctorId={ownOnly ? (appointment?.doctorId ?? null) : doctorId || null}
                  duration={duration}
                  value={time}
                  excludeId={appointment?.id}
                  onPick={(picked) => form.setValue('time', picked, { shouldValidate: true })}
                />
              )}
            </div>

            {appointment && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{SCHEDULE_UI.status}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as AppointmentStatus)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(APPOINTMENT_STATUS_LABELS)
                          // «Yakunlandi» tashrif orqali qoʻyiladi (10.6); tahrirda
                          // faqat allaqachon yakunlangan qabulda koʻrinadi
                          .filter(([key]) => key !== 'done' || appointment.status === 'done')
                          .map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{SCHEDULE_UI.note}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {CARD_UI.cancel}
              </Button>
              <Button type="submit" disabled={isPending || createPatient.isPending}>
                {isPending || createPatient.isPending ? UI_TEXT.loading : CARD_UI.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
