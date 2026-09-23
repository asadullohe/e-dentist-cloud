import {
  CARD_UI,
  formatDate,
  formatMoney,
  formatSom,
  LAB_UI,
  moneyDigits,
  PLAN_UI,
  parseDisplayDate,
  SCHEDULE_UI,
  SERVICE_UI,
  todayISO,
  UI_TEXT,
} from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { usePatient } from '@/entities/patient'
import { type Service, useServices } from '@/entities/service'
import { useHasPermission, useSession } from '@/entities/session'
import { useDoctors } from '@/entities/staff'
import type { Visit } from '@/entities/visit'
import { fieldErrors } from '@/shared/api'
import { applyServerErrors } from '@/shared/lib'
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Textarea,
  TimePicker,
} from '@/shared/ui'
import {
  useCompleteAppointment,
  useCompletePlanItem,
  useDeliverLabOrder,
  useSaveVisit,
} from './hooks'
import { EMPTY_VISIT, type VisitValues, visitSchema } from './model'

/// Qabulni yakunlash rejimi: tashrif shu qabulga yoziladi, sana va shifokor
/// qabuldan olinadi (10.6)
export interface CompletingAppointment {
  id: string
  doctorId: string | null
  /// YYYY-MM-DD
  date: string
}

/// Naryadni topshirish rejimi: tashrif shu naryadga bogʻlanadi, sana bugun,
/// texnik narxi shifokor ulushidan ayiriladi (qaror 19/09/2026)
export interface DeliveringLabOrder {
  id: string
  doctorId: string
  /// Oldindan toʻldiriladigan muolaja nomi: ish turi, material, tishlar
  treatment: string
  /// `lab.cost` boʻlmasa koʻrinmaydi — server baribir ayiradi
  techPrice: number | undefined
}

/// Reja bandini bajarish rejimi: tashrif shu bandga bogʻlanadi, muolaja,
/// tish va narx rejadan koʻchadi (13.4). Sana formada qoladi — ish kecha
/// qilingan boʻlishi mumkin
export interface CompletingPlanItem {
  planId: string
  itemId: string
  doctorId: string
  treatment: string
  tooth: number | null
  serviceId: string | null
  /// Bandning jami summasi (narx × miqdor)
  price: number
}

interface VisitFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  patientId: string
  /// Boʻsh boʻlsa — yangi tashrif
  visit?: Visit | undefined
  /// Berilsa — «Qabulni yakunlash»: saqlash qabulni ham yakunlaydi
  appointment?: CompletingAppointment | undefined
  /// Berilsa — «Naryadni topshirish»: saqlash naryadni ham topshiradi
  labOrder?: DeliveringLabOrder | undefined
  /// Berilsa — «Reja bandini bajarish»: saqlash bandni ham yopadi
  planItem?: CompletingPlanItem | undefined
  /// Naryad rejimida: tashrif avvalroq yozilgan boʻlsa — tashrifsiz topshirish
  onDeliverWithoutVisit?(): void
}

/// Tashrif sanasi — qabul kuni; kelajakdagi qabul bugun yakunlansa — bugun
/// (server ham shunday qiladi)
const visitDateOf = (appointment: CompletingAppointment) =>
  appointment.date > todayISO() ? todayISO() : appointment.date

/// Sukut vaqt — hozirgi soat («HH:MM»); qogʻozdan keyin kiritilsa oʻzgartiriladi
function nowTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function toValues(
  visit: Visit | undefined,
  appointment: CompletingAppointment | undefined,
  labOrder: DeliveringLabOrder | undefined,
  planItem: CompletingPlanItem | undefined,
): VisitValues {
  const fresh = { ...EMPTY_VISIT, time: nowTime() }
  if (labOrder) return { ...fresh, date: formatDate(todayISO()), treatment: labOrder.treatment }
  if (planItem) {
    return {
      ...fresh,
      date: formatDate(todayISO()),
      treatment: planItem.treatment,
      tooth: planItem.tooth === null ? '' : String(planItem.tooth),
      price: formatMoney(String(planItem.price)),
    }
  }
  if (appointment) return { ...fresh, date: formatDate(visitDateOf(appointment)) }
  if (!visit) return { ...fresh, date: formatDate(todayISO()) }
  return {
    date: formatDate(visit.date.slice(0, 10)),
    time: visit.time ?? nowTime(),
    treatment: visit.treatment,
    tooth: visit.tooth === null ? '' : String(visit.tooth),
    price: formatMoney(String(visit.price)),
    labCost: visit.labCost > 0 ? formatMoney(String(visit.labCost)) : '',
    note: visit.note ?? '',
  }
}

/// Xizmatlar tur boʻyicha, kelgan tartibda (tur tartibi → tur ichidagi tartib)
function groupByType(services: readonly Service[]): [string, Service[]][] {
  const groups = new Map<string, Service[]>()
  for (const item of services)
    groups.set(item.typeName, [...(groups.get(item.typeName) ?? []), item])
  return [...groups.entries()]
}

export function VisitFormDialog({
  open,
  onOpenChange,
  patientId,
  visit,
  appointment,
  labOrder,
  planItem,
  onDeliverWithoutVisit,
}: VisitFormDialogProps) {
  const save = useSaveVisit(visit?.id ?? null)
  const complete = useCompleteAppointment()
  const deliver = useDeliverLabOrder()
  const completePlanItem = useCompletePlanItem()
  const isPending =
    save.isPending || complete.isPending || deliver.isPending || completePlanItem.isPending
  const { data: services } = useServices()
  const { data: doctors } = useDoctors()
  const { data: session } = useSession()
  const [formError, setFormError] = useState('')
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [doctorId, setDoctorId] = useState('')
  // Shifokor tanlovi react-hook-form dan tashqarida (serviceId kabi) —
  // server xatosi shu yerda ushlanadi
  const [doctorError, setDoctorError] = useState('')

  // Sukut — bemorning biriktirilgan shifokori (10.4); yoʻq boʻlsa kirgan
  // odamning oʻzi (koʻpincha tashrifni shifokor oʻzi yozadi). Eski tashrifda
  // shifokor boʻlmasa ham shu, tahrirda tanlab qoʻyiladi
  const { data: patientCard } = usePatient(patientId)
  const selfId = session?.user.id ?? ''
  // `patients.all` yoʻq (shifokor): tashrif doim oʻz nomidan — server ham
  // shunday qiladi, tanlov koʻrsatilmaydi (11-bosqich)
  const seesAll = useHasPermission()('patients.all')
  // Yakunlashda — qabulning shifokori birinchi navbatda
  const defaultDoctorId =
    labOrder?.doctorId ??
    planItem?.doctorId ??
    appointment?.doctorId ??
    patientCard?.doctorId ??
    selfId

  const form = useForm<VisitValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: toValues(visit, appointment, labOrder, planItem),
  })

  // Oyna qayta ochilganda maydonlar tanlangan tashrifga moslanadi
  useEffect(() => {
    if (open) {
      form.reset(toValues(visit, appointment, labOrder, planItem))
      setFormError('')
      setServiceId(visit?.serviceId ?? planItem?.serviceId ?? null)
      setDoctorId(visit?.doctorId ?? defaultDoctorId)
      setDoctorError('')
    }
  }, [open, visit, appointment, labOrder, planItem, form, defaultDoctorId])

  // Texnik narxi maydoni: qiymat bor yoki tanlangan xizmatda texnik ishi bor
  const labCostValue = form.watch('labCost')
  const pickedService = services?.find((item) => item.id === serviceId)
  const showLabCost = labCostValue !== '' || Boolean(pickedService?.techPrice)

  async function onSubmit(values: VisitValues) {
    setFormError('')
    setDoctorError('')
    const payload = {
      doctorId,
      time: values.time,
      treatment: values.treatment,
      tooth: values.tooth ? Number(values.tooth) : null,
      serviceId,
      price: Number(moneyDigits(values.price) || 0),
      labCost: Number(moneyDigits(values.labCost) || 0),
      note: values.note || null,
    }
    try {
      if (labOrder) {
        // Sana bugun, bemor naryaddan — server oʻzi qoʻyadi
        await deliver.mutateAsync({ labOrderId: labOrder.id, ...payload })
      } else if (planItem) {
        // Bemor rejadan; sana formada qoladi — ish kecha qilingan boʻlishi mumkin
        await completePlanItem.mutateAsync({
          planId: planItem.planId,
          itemId: planItem.itemId,
          date: parseDisplayDate(values.date) as string,
          ...payload,
        })
      } else if (appointment) {
        // Sana qabuldan — server oʻzi qoʻyadi
        await complete.mutateAsync({ appointmentId: appointment.id, ...payload })
      } else {
        await save.mutateAsync({
          ...(visit ? {} : { patientId }),
          date: parseDisplayDate(values.date) as string,
          ...payload,
        })
      }
      onOpenChange(false)
    } catch (error) {
      setDoctorError(fieldErrors(error).doctorId ?? '')
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {labOrder
              ? LAB_UI.deliver_title
              : planItem
                ? PLAN_UI.complete_title
                : appointment
                  ? SCHEDULE_UI.complete
                  : visit
                    ? CARD_UI.edit_visit
                    : CARD_UI.add_visit}
          </DialogTitle>
          {labOrder && (
            <DialogDescription>
              {LAB_UI.deliver_hint(
                labOrder.techPrice === undefined ? '…' : formatSom(labOrder.techPrice),
              )}
            </DialogDescription>
          )}
          {appointment && (
            <DialogDescription>
              {SCHEDULE_UI.complete_hint(formatDate(visitDateOf(appointment)))}
            </DialogDescription>
          )}
          {planItem && <DialogDescription>{PLAN_UI.complete_hint}</DialogDescription>}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Sana · vaqt bir qatorda; yakunlash/topshirishda sana yoʻq — vaqt yarim qator */}
            <div className="grid grid-cols-2 gap-3">
              {/* Yakunlashda sana qabulniki, topshirishda bugun — maydon koʻrsatilmaydi */}
              {!appointment && !labOrder && (
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{CARD_UI.date}</FormLabel>
                      <FormControl>
                        <DatePicker {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {/* Vaqt: sukut hozirgi soat; 24 soatli oʻz maydonimiz (AM/PM siz) */}
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CARD_UI.time}</FormLabel>
                    <FormControl>
                      <TimePicker {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {seesAll && (
              <div className="space-y-1.5">
                <Label htmlFor="visit-doctor">{CARD_UI.doctor}</Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger id="visit-doctor" className="w-full">
                    <SelectValue placeholder={CARD_UI.doctor} />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {doctorError && <p className="text-destructive text-sm">{doctorError}</p>}
              </div>
            )}

            {services && services.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="visit-service">{SERVICE_UI.pick}</Label>
                <Select
                  value={serviceId ?? ''}
                  onValueChange={(id) => {
                    // Xizmatlardan tanlash — muolaja nomi va narxni toʻldiradi.
                    // Ikkalasi ham keyin qoʻlda oʻzgartirilishi mumkin:
                    // tashrifda ular matn va son sifatida saqlanadi
                    setServiceId(id)
                    const picked = services.find((item) => item.id === id)
                    if (picked) {
                      form.setValue('treatment', picked.name)
                      form.setValue('price', formatMoney(String(picked.price)))
                      // Texnik narxi ham xizmatdan — snapshot, keyin tahrirlash mumkin
                      form.setValue(
                        'labCost',
                        picked.techPrice ? formatMoney(String(picked.techPrice)) : '',
                      )
                    }
                  }}
                >
                  <SelectTrigger id="visit-service" className="w-full">
                    <SelectValue placeholder={SERVICE_UI.pick_placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Tur boʻyicha guruhlar — roʻyxat tur tartibida keladi */}
                    {groupByType(services).map(([typeName, items]) => (
                      <SelectGroup key={typeName}>
                        <SelectLabel>{typeName}</SelectLabel>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} · {formatSom(item.price)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{CARD_UI.treatment}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Narx · tish bir qatorda — ikkalasi qisqa */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CARD_UI.price}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        {...field}
                        onChange={(event) => field.onChange(formatMoney(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tooth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CARD_UI.tooth}</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Texnik narxi — xizmatdan koʻchgan yoki qoʻlda; naryad rejimida
                naryadniki (yuqorida koʻrsatilgan), bogʻlangan tashrifda oʻzgarmaydi */}
            {!labOrder && (showLabCost || Boolean(visit?.labOrderId)) && (
              <FormField
                control={form.control}
                name="labCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{SERVICE_UI.tech_price}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        readOnly={Boolean(visit?.labOrderId)}
                        {...field}
                        onChange={(event) => field.onChange(formatMoney(event.target.value))}
                      />
                    </FormControl>
                    <FormDescription>{SERVICE_UI.tech_hint}</FormDescription>
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
                  <FormLabel>{CARD_UI.note}</FormLabel>
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
              {labOrder && onDeliverWithoutVisit && (
                <Button
                  type="button"
                  variant="ghost"
                  title={LAB_UI.deliver_without_visit_hint}
                  disabled={isPending}
                  onClick={onDeliverWithoutVisit}
                >
                  {LAB_UI.deliver_without_visit}
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? UI_TEXT.loading
                  : labOrder
                    ? LAB_UI.deliver_submit
                    : planItem
                      ? PLAN_UI.complete_submit
                      : appointment
                        ? SCHEDULE_UI.complete_submit
                        : CARD_UI.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
