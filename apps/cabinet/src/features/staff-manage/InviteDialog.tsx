import { AUTH_TEXT, CARD_UI, STAFF_UI, UI_TEXT } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRoles } from '@/entities/staff'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import { useInviteStaff } from './hooks'

const schema = z.object({
  email: z.string().trim().email(AUTH_TEXT.email_invalid),
  roleId: z.string().uuid(),
})

type Values = z.infer<typeof schema>

interface InviteDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const { data: roles } = useRoles()
  const { mutateAsync, isPending } = useInviteStaff()
  const [formError, setFormError] = useState('')

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', roleId: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({ email: '', roleId: '' })
      setFormError('')
    }
  }, [open, form])

  async function onSubmit(values: Values) {
    setFormError('')
    try {
      await mutateAsync(values)
      onOpenChange(false)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{STAFF_UI.invite_title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{STAFF_UI.email}</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{STAFF_UI.role}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={STAFF_UI.role} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {isPending ? UI_TEXT.sending : STAFF_UI.invite}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
