import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TEXT,
  CARD_UI,
  formatDate,
  parseDisplayDate,
  SCHEDULE_UI,
  UI_TEXT,
  VALIDATION_TEXT,
} from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Appointment, AppointmentStatus } from '@/entities/appointment'
import { PatientPicker } from '@/entities/patient'
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
  Input,
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
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/// Maydon nomlari server sxemasi bilan bir xil — serverdan kelgan xato
/// (`fields.time`) toʻgʻri maydon ostiga tushadi (applyServerErrors)
const schema = z.object({
  /// Yangi qabulda majburiy; tahrirda bemor oʻzgarmaydi
  patientId: z.string(),
  /// Boʻsh — shifokorsiz
  doctorId: z.string(),
  // Ekranda KK/OO/YYYY, serverga YYYY-MM-DD
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
  status: z.enum(['scheduled', 'arrived', 'no_show', 'done', 'cancelled']),
  note: z.string().trim().max(500),
})

type Values = z.infer<typeof schema>

interface AppointmentFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  /// Boʻsh boʻlsa — yangi qabul. Kalendarda bosilgan kun shu yerga keladi
  defaultDate: string
  appointment?: Appointment | undefined
  /// Saqlangan qabul — sahifa kalendarni oʻsha kunga oʻtkazadi
  onSaved?(appointment: Appointment): void
}

function localTime(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toValues(appointment: Appointment | undefined, defaultDate: string): Values {
  if (!appointment) {
    return {
      patientId: '',
      doctorId: '',
      date: formatDate(defaultDate),
      time: '',
      status: 'scheduled',
      note: '',
    }
  }
  return {
    patientId: appointment.patientId,
    doctorId: appointment.doctorId ?? '',
    date: formatDate(appointment.at.slice(0, 10)),
    time: localTime(appointment.at),
    status: appointment.status,
    note: appointment.note ?? '',
  }
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  defaultDate,
  appointment,
  onSaved,
}: AppointmentFormDialogProps) {
  const { mutateAsync, isPending } = useSaveAppointment(appointment?.id ?? null)
  const { data: doctors } = useDoctors()
  const [patientName, setPatientName] = useState('')
  const [formError, setFormError] = useState('')

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(appointment, defaultDate),
  })

  useEffect(() => {
    if (open) {
      form.reset(toValues(appointment, defaultDate))
      setPatientName(appointment?.fio ?? '')
      setFormError('')
    }
  }, [open, appointment, defaultDate, form])

  async function onSubmit(values: Values) {
    setFormError('')
    if (!appointment && !values.patientId) {
      form.setError('patientId', { message: APPOINTMENT_TEXT.patient_required })
      return
    }
    try {
      const saved = await mutateAsync({
        ...(appointment ? { status: values.status } : { patientId: values.patientId }),
        doctorId: values.doctorId || null,
        date: parseDisplayDate(values.date) as string,
        time: values.time,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{appointment ? SCHEDULE_UI.edit : SCHEDULE_UI.add}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            {!appointment && (
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{SCHEDULE_UI.patient}</FormLabel>
                    <FormControl>
                      <PatientPicker
                        value={field.value || null}
                        label={patientName}
                        onPick={(id, fio, patient) => {
                          field.onChange(id)
                          setPatientName(fio)
                          // Bemorning biriktirilgan shifokori — sukut (10.2)
                          form.setValue('doctorId', patient.doctorId ?? '')
                          form.clearErrors('patientId')
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{SCHEDULE_UI.time}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <Button type="submit" disabled={isPending}>
                {isPending ? UI_TEXT.loading : CARD_UI.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
