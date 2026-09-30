import {
  CARD_UI,
  formatUzPhone,
  LAB_TEXT,
  LAB_UI,
  phoneDigits,
  UI_TEXT,
  VALIDATION_TEXT,
} from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { LabPlace } from '@/entities/lab-order'
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
} from '@/shared/ui'
import { useSaveLab } from './hooks'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: () => LAB_TEXT.lab_name_required })
    .max(120),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || phoneDigits(value).length === 9, {
      error: () => VALIDATION_TEXT.phone_incomplete,
    }),
})

type Values = z.infer<typeof schema>

function toValues(lab: LabPlace | null): Values {
  return { name: lab?.name ?? '', phone: lab?.phone ? formatUzPhone(lab.phone) : '' }
}

/// Tashqi laboratoriya: nomi va telefoni (tz.md 20-boʻlim)
export function LabPlaceDialog({
  open,
  lab,
  onOpenChange,
}: {
  open: boolean
  /// `null` — yangi
  lab: LabPlace | null
  onOpenChange(open: boolean): void
}) {
  const { mutateAsync, isPending } = useSaveLab(lab?.id ?? null)
  const [formError, setFormError] = useState('')
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(lab) })

  useEffect(() => {
    if (open) {
      form.reset(toValues(lab))
      setFormError('')
    }
  }, [open, lab, form])

  async function onSubmit(values: Values) {
    setFormError('')
    try {
      await mutateAsync({ name: values.name, phone: values.phone || null })
      onOpenChange(false)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{lab ? LAB_UI.lab_edit : LAB_UI.lab_add}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{LAB_UI.lab_name}</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{LAB_UI.lab_phone}</FormLabel>
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
