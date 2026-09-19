import { formatDate, formatSom, PAYMENT_TEXT, PAYMENT_UI, UI_TEXT } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Payment } from '@/entities/payment'
import { applyServerErrors } from '@/shared/lib'
import {
  Button,
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
  Textarea,
} from '@/shared/ui'
import { useCancelPayment } from './hooks'

/// Maydon nomi server sxemasi bilan bir xil — xato `fields.reason` ga tushadi
const schema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, { error: () => PAYMENT_TEXT.reason_required })
    .max(500),
})
type Values = z.infer<typeof schema>

interface CancelPaymentDialogProps {
  /// Boʻsh — oyna yopiq
  payment: Payment | null
  onClose(): void
}

/// Toʻlov oʻchirilmaydi — bekor qilinadi, sabab majburiy (qaror 19/09/2026).
/// Sabab toʻlov yonida koʻrinib turadi, shuning uchun tasdiqlash oynasi
/// emas, kichik forma
export function CancelPaymentDialog({ payment, onClose }: CancelPaymentDialogProps) {
  const { mutateAsync, isPending } = useCancelPayment()
  const [formError, setFormError] = useState('')
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { reason: '' } })

  const open = payment !== null
  useEffect(() => {
    if (open) {
      form.reset({ reason: '' })
      setFormError('')
    }
  }, [open, form])

  async function onSubmit(values: Values) {
    if (!payment) return
    setFormError('')
    try {
      await mutateAsync({ id: payment.id, reason: values.reason })
      onClose()
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{PAYMENT_UI.cancel_title}</DialogTitle>
          <DialogDescription>{PAYMENT_UI.cancel_text}</DialogDescription>
        </DialogHeader>

        {payment && (
          <p className="text-sm">
            <span className="font-semibold tabular-nums">{formatSom(payment.amount)}</span>
            <span className="text-muted-foreground">
              {' '}
              · {formatDate(payment.date.slice(0, 10))}
            </span>
          </p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{PAYMENT_UI.cancel_reason}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder={PAYMENT_UI.cancel_reason_placeholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}

            <DialogFooter>
              {/* «Yopish», «Bekor qilish» emas — yonidagi tugma toʻlovni bekor qiladi */}
              <Button type="button" variant="outline" onClick={onClose}>
                {UI_TEXT.close}
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? UI_TEXT.loading : PAYMENT_UI.cancel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
