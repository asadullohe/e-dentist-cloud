import {
  CARD_UI,
  formatDate,
  formatMoney,
  maskDisplayDate,
  moneyDigits,
  PAYMENT_UI,
  parseDisplayDate,
  UI_TEXT,
} from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Payment } from '@/entities/payment'
import { applyServerErrors } from '@/shared/lib'
import {
  Button,
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
  Textarea,
} from '@/shared/ui'
import { useSavePayment } from './hooks'
import { EMPTY_PAYMENT, type PaymentValues, paymentSchema } from './model'

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

  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: toValues(payment),
  })

  useEffect(() => {
    if (open) {
      form.reset(toValues(payment))
      setFormError('')
    }
  }, [open, payment, form])

  async function onSubmit(values: PaymentValues) {
    setFormError('')
    try {
      await mutateAsync({
        ...(payment ? {} : { patientId }),
        date: parseDisplayDate(values.date) as string,
        amount: Number(moneyDigits(values.amount) || 0),
        note: values.note || null,
      })
      onOpenChange(false)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{payment ? PAYMENT_UI.edit : PAYMENT_UI.add}</DialogTitle>
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
                    <Input
                      inputMode="numeric"
                      placeholder="02/09/2026"
                      {...field}
                      onChange={(event) => field.onChange(maskDisplayDate(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{PAYMENT_UI.amount}</FormLabel>
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
