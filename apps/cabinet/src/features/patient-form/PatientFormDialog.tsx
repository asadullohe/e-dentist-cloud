import {
  formatDate,
  formatUzPhone,
  PATIENT_UI,
  parseDisplayDate,
  QUEUE_CABINET_UI,
} from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Patient } from '@/entities/patient'
import { useDoctorScope } from '@/entities/session'
import { useDoctors } from '@/entities/staff'
import { applyServerErrors, saveLastDoctor } from '@/shared/lib'
import {
  Button,
  Checkbox,
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
  Label,
  Textarea,
} from '@/shared/ui'
import { DoctorField } from './DoctorField'
import { useSavePatient } from './hooks'
import { EMPTY_PATIENT, type PatientValues, patientSchema } from './model'

interface PatientFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  /// Boʻsh boʻlsa — yangi bemor
  patient?: Patient | undefined
  /// «Bugun navbatga qoʻshish» belgisi (faqat yaratishda). Navbatga
  /// qoʻshishning oʻzi sahifada — feature boshqa feature'ni import qilmaydi
  enqueueOption?: boolean
  onCreated?(patient: Patient, options: { enqueueToday: boolean }): void
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

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  enqueueOption = false,
  onCreated,
}: PatientFormDialogProps) {
  const { mutateAsync, isPending } = useSavePatient(patient?.id ?? null)
  const { data: allDoctors } = useDoctors()
  // Cheklangan koʻruvchi (shifokor, assistent) faqat oʻz doirasiga biriktiradi —
  // aks holda bemor saqlangach uning roʻyxatidan gʻoyib boʻlardi. Tahrirdagi
  // bemorning hozirgi shifokori roʻyxatda qoladi (tz.md 20-boʻlim)
  const scope = useDoctorScope('patients.all')
  const doctors = (allDoctors ?? []).filter(
    (item) => scope.allows(item.id) || item.id === patient?.doctorId,
  )
  const scopeRef = useRef(scope)
  scopeRef.current = scope
  // Individualda shifokor bitta (egasi) — maydon yashirin, yangi bemor unga
  // biriktiriladi: navbatga qoʻshish ham shifokorni talab qiladi
  const soleDoctor = scope.solo ? (allDoctors?.[0]?.id ?? '') : ''
  const [formError, setFormError] = useState('')
  // Yangi bemor odatda oldida turadi — qabulxona uni darhol shifokor
  // navbatiga qoʻyadi. Sukut yoqilgan; tahrirda koʻrinmaydi (10.3)
  const canEnqueue = !patient && enqueueOption
  const [enqueueToday, setEnqueueToday] = useState(true)

  const form = useForm<PatientValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: toValues(patient),
  })

  // Oyna qayta ochilganda maydonlar tanlangan bemorga moslanadi
  useEffect(() => {
    if (open) {
      // Assistentda yangi bemor — oxirgi tanlangan yoki yagona shifokori
      const fallback = !patient ? scopeRef.current.fallback() : ''
      form.reset({ ...toValues(patient), ...(fallback ? { doctorId: fallback } : {}) })
      setFormError('')
      setEnqueueToday(true)
    }
  }, [open, patient, form])

  async function onSubmit(input: PatientValues) {
    const values = { ...input, doctorId: input.doctorId || (patient ? '' : soleDoctor) }
    setFormError('')
    if (canEnqueue && enqueueToday && !values.doctorId) {
      form.setError('doctorId', { message: QUEUE_CABINET_UI.enqueue_needs_doctor })
      return
    }
    try {
      const saved = await mutateAsync({
        fio: values.fio,
        phone: values.phone || undefined,
        birthDate: values.birthDate ? (parseDisplayDate(values.birthDate) ?? undefined) : undefined,
        address: values.address || undefined,
        note: values.note || undefined,
        doctorId: values.doctorId || null,
      })
      if (scope.proxy && values.doctorId) saveLastDoctor(values.doctorId)
      onOpenChange(false)
      if (!patient) onCreated?.(saved, { enqueueToday: canEnqueue && enqueueToday })
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
            {!scope.solo && <DoctorField control={form.control} doctors={doctors} />}

            {canEnqueue && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="patient-enqueue"
                  checked={enqueueToday}
                  onCheckedChange={(state) => setEnqueueToday(state === true)}
                />
                <Label htmlFor="patient-enqueue" className="font-normal">
                  {QUEUE_CABINET_UI.enqueue_on_create}
                </Label>
              </div>
            )}

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
