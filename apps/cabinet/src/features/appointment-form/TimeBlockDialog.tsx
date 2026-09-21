import {
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
import type { TimeBlock } from '@/entities/appointment'
import { useDoctors } from '@/entities/staff'
import { applyServerErrors } from '@/shared/lib'
import {
  Button,
  Checkbox,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TimePicker,
} from '@/shared/ui'
import { useSaveTimeBlock } from './hooks'
import { localTime } from './slots'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const displayDate = z
  .string()
  .trim()
  .min(1, { error: () => VALIDATION_TEXT.date_invalid })
  .refine((value) => parseDisplayDate(value) !== null, {
    error: () => VALIDATION_TEXT.date_invalid,
  })
const time = z
  .string()
  .trim()
  .min(1, { error: () => APPOINTMENT_TEXT.time_required })
  .regex(TIME, { error: () => APPOINTMENT_TEXT.time_invalid })

const schema = z.object({
  doctorId: z.string(),
  fromDate: displayDate,
  fromTime: time,
  toDate: displayDate,
  toTime: time,
  reason: z.string().trim().max(200),
})
type Values = z.infer<typeof schema>

/// «Butun kun» — ish kuni chegaralari (vaqt toʻri bilan bir xil)
const DAY_FROM = '08:00'
const DAY_TO = '20:00'

function toValues(
  block: TimeBlock | undefined,
  defaults: { date: string; doctorId?: string },
): Values {
  if (!block) {
    return {
      doctorId: defaults.doctorId ?? '',
      fromDate: formatDate(defaults.date),
      fromTime: DAY_FROM,
      toDate: formatDate(defaults.date),
      toTime: DAY_TO,
      reason: '',
    }
  }
  return {
    doctorId: block.doctorId,
    fromDate: formatDate(block.startsAt.slice(0, 10)),
    fromTime: localTime(block.startsAt),
    toDate: formatDate(block.endsAt.slice(0, 10)),
    toTime: localTime(block.endsAt),
    reason: block.reason ?? '',
  }
}

/// Shifokorning band vaqti: tushlik, oʻqish, taʼtil — bu oraliqqa qabul
/// yozilmaydi. Bir kun ichida yoki bir necha kun (sana «dan – gacha»)
export function TimeBlockDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultDoctorId,
  block,
  ownOnly = false,
}: {
  open: boolean
  onOpenChange(open: boolean): void
  defaultDate: string
  defaultDoctorId?: string
  block?: TimeBlock | undefined
  /// `schedule.all` yoʻq — doim oʻziga
  ownOnly?: boolean
}) {
  const { mutateAsync, isPending } = useSaveTimeBlock(block?.id ?? null)
  const { data: doctors } = useDoctors()
  const [allDay, setAllDay] = useState(false)
  const [formError, setFormError] = useState('')
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(block, { date: defaultDate }),
  })

  useEffect(() => {
    if (open) {
      const values = toValues(block, { date: defaultDate, doctorId: defaultDoctorId })
      form.reset(values)
      setAllDay(!block || (values.fromTime === DAY_FROM && values.toTime === DAY_TO))
      setFormError('')
    }
  }, [open, block, defaultDate, defaultDoctorId, form])

  function toggleAllDay(next: boolean) {
    setAllDay(next)
    if (next) {
      form.setValue('fromTime', DAY_FROM)
      form.setValue('toTime', DAY_TO)
    }
  }

  async function onSubmit(values: Values) {
    setFormError('')
    try {
      await mutateAsync({
        ...(ownOnly || !values.doctorId ? {} : { doctorId: values.doctorId }),
        fromDate: parseDisplayDate(values.fromDate) as string,
        fromTime: values.fromTime,
        toDate: parseDisplayDate(values.toDate) as string,
        toTime: values.toTime,
        reason: values.reason || null,
      })
      onOpenChange(false)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{block ? SCHEDULE_UI.block_edit : SCHEDULE_UI.block_add}</DialogTitle>
          <DialogDescription>{SCHEDULE_UI.block_hint}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            {!ownOnly && (
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{SCHEDULE_UI.doctor}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={SCHEDULE_UI.doctor} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

            <div className="flex items-center gap-2">
              <Checkbox
                id="block-all-day"
                checked={allDay}
                onCheckedChange={(state) => toggleAllDay(state === true)}
              />
              <Label htmlFor="block-all-day">{SCHEDULE_UI.block_all_day}</Label>
            </div>

            {/* Dan: sana · vaqt; Gacha: sana · vaqt — koʻp kunlik taʼtil uchun ham */}
            {(['from', 'to'] as const).map((side) => (
              <div key={side} className="grid grid-cols-[1fr_7.5rem] gap-3">
                <FormField
                  control={form.control}
                  name={`${side}Date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {side === 'from' ? SCHEDULE_UI.block_from : SCHEDULE_UI.block_to}
                      </FormLabel>
                      <FormControl>
                        <DatePicker {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`${side}Time`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{SCHEDULE_UI.time}</FormLabel>
                      <FormControl>
                        <TimePicker {...field} disabled={allDay} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{SCHEDULE_UI.block_reason}</FormLabel>
                  <FormControl>
                    <Input placeholder={SCHEDULE_UI.block_reason_placeholder} {...field} />
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
