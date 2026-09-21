import { CARD_UI, SERVICE_TEXT, SERVICE_UI, UI_TEXT } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ServiceType } from '@/entities/service'
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
import { useSaveServiceType } from './hooks'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: () => SERVICE_TEXT.type_name_required })
    .max(200),
})
type Values = z.infer<typeof schema>

/// Xizmat turi: faqat nom. Tartib — sahifada tortib
export function ServiceTypeDialog({
  open,
  onOpenChange,
  type,
  onSaved,
}: {
  open: boolean
  onOpenChange(open: boolean): void
  type?: ServiceType | undefined
  onSaved?(type: ServiceType): void
}) {
  const { mutateAsync, isPending } = useSaveServiceType(type?.id ?? null)
  const [formError, setFormError] = useState('')
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '' } })

  useEffect(() => {
    if (open) {
      form.reset({ name: type?.name ?? '' })
      setFormError('')
    }
  }, [open, type, form])

  async function onSubmit(values: Values) {
    setFormError('')
    try {
      const saved = await mutateAsync(values.name)
      onOpenChange(false)
      onSaved?.(saved)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{type ? SERVICE_UI.type_edit : SERVICE_UI.type_add}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{SERVICE_UI.type_name}</FormLabel>
                  <FormControl>
                    <Input autoFocus placeholder={SERVICE_UI.type_name_placeholder} {...field} />
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
