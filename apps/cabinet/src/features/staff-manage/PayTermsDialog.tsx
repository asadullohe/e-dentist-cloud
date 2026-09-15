import { CARD_UI, formatMoney, moneyDigits, STAFF_TEXT, STAFF_UI, UI_TEXT } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { StaffMember } from '@/entities/staff'
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
  Input,
} from '@/shared/ui'
import { useUpdateStaff } from './hooks'

/// Ikkala maydon ham maskalangan matn: «2 000 000» va «50»
const schema = z.object({
  salaryAmount: z.string().trim(),
  payPercent: z
    .string()
    .trim()
    .refine((value) => value === '' || (Number(value) >= 0 && Number(value) <= 100), {
      error: () => STAFF_TEXT.percent_range,
    }),
})

type Values = z.infer<typeof schema>

interface PayTermsDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  person: StaffMember | null
}

function toValues(person: StaffMember | null): Values {
  return {
    salaryAmount: person && person.salaryAmount > 0 ? formatMoney(String(person.salaryAmount)) : '',
    payPercent: person && person.payPercent > 0 ? String(person.payPercent) : '',
  }
}

/// Xodimning ish haqi sharti: oylik va foiz (tz.md 15-boʻlim). Ikkalasi
/// birga boʻlishi mumkin — «baza + foiz»
export function PayTermsDialog({ open, onOpenChange, person }: PayTermsDialogProps) {
  const { mutateAsync, isPending } = useUpdateStaff()
  const [formError, setFormError] = useState('')

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(person),
  })

  useEffect(() => {
    if (open) {
      form.reset(toValues(person))
      setFormError('')
    }
  }, [open, person, form])

  async function onSubmit(values: Values) {
    if (!person) return
    setFormError('')
    try {
      await mutateAsync({
        id: person.id,
        salaryAmount: Number(moneyDigits(values.salaryAmount) || 0),
        payPercent: Number(values.payPercent || 0),
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
          <DialogTitle>{STAFF_UI.pay_title(person?.fullName ?? '')}</DialogTitle>
          <DialogDescription>{STAFF_UI.pay_hint}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            <FormField
              control={form.control}
              name="salaryAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{STAFF_UI.salary}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="0"
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
              name="payPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{STAFF_UI.percent}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="0"
                      {...field}
                      onChange={(event) =>
                        field.onChange(event.target.value.replace(/\D/g, '').slice(0, 3))
                      }
                    />
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
