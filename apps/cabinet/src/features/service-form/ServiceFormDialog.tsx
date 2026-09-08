import {
  CARD_UI,
  formatMoney,
  moneyDigits,
  SERVICE_TEXT,
  SERVICE_UI,
  UI_TEXT,
} from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Service } from '@/entities/service'
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
import { useSaveService } from './hooks'

const schema = z.object({
  name: z.string().trim().min(2, SERVICE_TEXT.name_required).max(200),
  /// Maskalangan matn: «250 000»
  price: z.string().trim(),
})

type Values = z.infer<typeof schema>

interface ServiceFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  service?: Service | undefined
}

export function ServiceFormDialog({ open, onOpenChange, service }: ServiceFormDialogProps) {
  const { mutateAsync, isPending } = useSaveService(service?.id ?? null)
  const [formError, setFormError] = useState('')

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', price: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: service?.name ?? '',
        price: service ? formatMoney(String(service.price)) : '',
      })
      setFormError('')
    }
  }, [open, service, form])

  async function onSubmit(values: Values) {
    setFormError('')
    try {
      await mutateAsync({ name: values.name, price: Number(moneyDigits(values.price) || 0) })
      onOpenChange(false)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{service ? SERVICE_UI.edit : SERVICE_UI.add}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{SERVICE_UI.name}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{SERVICE_UI.price}</FormLabel>
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
