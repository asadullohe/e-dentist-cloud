import {
  CARD_UI,
  formatDate,
  formatMoney,
  moneyDigits,
  PAYMENT_UI,
  parseDisplayDate,
  UI_TEXT,
} from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Payment } from '@/entities/payment'
import { useVisits } from '@/entities/visit'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@/shared/ui'
import { useSavePayment } from './hooks'
import { EMPTY_PAYMENT, type PaymentValues, paymentSchema } from './model'
import { openWorks, type Picked, pickedTotal, WorksPicker } from './WorksPicker'

interface PaymentFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  patientId: string
  /// Boʻsh boʻlsa — yangi toʻlov
  payment?: Payment | undefined
}

function toValues(payment: Payment | undefined): PaymentValues {
  if (!payment) {
    return { ...EMPTY_PAYMENT, date: formatDate(new Date().toISOString().slice(0, 10)) }
  }
  return {
    date: formatDate(payment.date.slice(0, 10)),
    amount: formatMoney(String(payment.amount)),
    note: payment.note ?? '',
  }
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  patientId,
  payment,
}: PaymentFormDialogProps) {
  const { mutateAsync, isPending } = useSavePayment(payment?.id ?? null)
  const [formError, setFormError] = useState('')
  // Qaysi ish uchun — yangi toʻlovda; belgilanganda summa shundan yigʻiladi
  const { data: visits } = useVisits(payment ? undefined : patientId)
  const [picked, setPicked] = useState<Picked>(new Map())
  const works = openWorks(visits ?? [])

  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: toValues(payment),
  })

  useEffect(() => {
    if (open) {
      form.reset(toValues(payment))
      setFormError('')
      setPicked(new Map())
    }
  }, [open, payment, form])

  function pick(next: Picked) {
    setPicked(next)
    if (next.size > 0) form.setValue('amount', formatMoney(String(pickedTotal(next))))
  }

  // Tahrirda summa va sana qulf: pul yozuvi keyin «tuzatilmaydi» — xato boʻlsa
  // bekor qilib, yangisi kiritiladi (qaror 19/09/2026)
  const locked = payment !== undefined

  async function onSubmit(values: PaymentValues) {
    setFormError('')
    try {
      await mutateAsync({
        patientId,
        date: parseDisplayDate(values.date) as string,
        amount: Number(moneyDigits(values.amount) || 0),
        note: values.note || null,
        ...(picked.size > 0
          ? {
              allocations: [...picked.entries()]
                .map(([visitId, value]) => ({ visitId, amount: Number(moneyDigits(value) || 0) }))
                .filter((row) => row.amount > 0),
            }
          : {}),
      })
      onOpenChange(false)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={locked ? 'sm:max-w-sm' : 'sm:max-w-md'}>
        <DialogHeader>
          <DialogTitle>{locked ? PAYMENT_UI.edit_note : PAYMENT_UI.add}</DialogTitle>
          {locked && <DialogDescription>{PAYMENT_UI.edit_hint}</DialogDescription>}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{PAYMENT_UI.date}</FormLabel>
                  <FormControl>
                    <DatePicker {...field} disabled={locked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!locked && <WorksPicker works={works} picked={picked} onChange={pick} />}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{PAYMENT_UI.amount}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      disabled={locked}
                      // Ishlar belgilangan — summa ularning yigʻindisi
                      readOnly={picked.size > 0}
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
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{PAYMENT_UI.note}</FormLabel>
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
