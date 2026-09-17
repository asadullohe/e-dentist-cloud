import { formatDate, formatUzPhone, PATIENT_UI, parseDisplayDate } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Patient } from '@/entities/patient'
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
  FormDescription,
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
import { useSavePatient } from './hooks'
import { EMPTY_PATIENT, type PatientValues, patientSchema } from './model'

interface PatientFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  /// Boʻsh boʻlsa — yangi bemor
  patient?: Patient | undefined
}

function toValues(patient: Patient | undefined): PatientValues {
  if (!patient) return EMPTY_PATIENT
  return {
    fio: patient.fio,
    phone: patient.phone ? formatUzPhone(patient.phone) : '',
    birthDate: patient.birthDate ? formatDate(patient.birthDate.slice(0, 10)) : '',
    address: patient.address ?? '',
    note: patient.note ?? '',
    doctorId: patient.doctorId ?? '',
  }
}

/// Radix Select boʻsh satrni qabul qilmaydi — «biriktirilmagan» uchun belgi
const NO_DOCTOR = '__none__'

export function PatientFormDialog({ open, onOpenChange, patient }: PatientFormDialogProps) {
  const { mutateAsync, isPending } = useSavePatient(patient?.id ?? null)
  const { data: doctors } = useDoctors()
  const [formError, setFormError] = useState('')

  const form = useForm<PatientValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: toValues(patient),
  })

  // Oyna qayta ochilganda maydonlar tanlangan bemorga moslanadi
  useEffect(() => {
    if (open) {
      form.reset(toValues(patient))
      setFormError('')
    }
  }, [open, patient, form])

  async function onSubmit(values: PatientValues) {
    setFormError('')
    try {
      await mutateAsync({
        fio: values.fio,
        phone: values.phone || undefined,
        birthDate: values.birthDate ? (parseDisplayDate(values.birthDate) ?? undefined) : undefined,
        address: values.address || undefined,
        note: values.note || undefined,
        doctorId: values.doctorId || null,
      })
      onOpenChange(false)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{patient ? PATIENT_UI.edit_title : PATIENT_UI.add_title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            <FormField
              control={form.control}
              name="fio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{PATIENT_UI.fio}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{PATIENT_UI.phone}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="tel"
                        placeholder="+998 90 123 45 67"
                        {...field}
                        onChange={(event) => field.onChange(formatUzPhone(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{PATIENT_UI.birth_date}</FormLabel>
                    <FormControl>
                      {/* Yil roʻyxati 1920 dan shu yilgacha — 100 yoshli bemor ham boʻladi */}
                      <DatePicker {...field} yearRange={[1920, new Date().getFullYear()]} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{PATIENT_UI.doctor}</FormLabel>
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
                      <SelectItem value={NO_DOCTOR}>{PATIENT_UI.doctor_none}</SelectItem>
                      {doctors?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{PATIENT_UI.doctor_hint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{PATIENT_UI.address}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{PATIENT_UI.note}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormDescription>{PATIENT_UI.note_hint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {PATIENT_UI.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? PATIENT_UI.saving : PATIENT_UI.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
