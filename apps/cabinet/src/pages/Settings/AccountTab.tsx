import { AUTH_TEXT, STAFF_UI, UI_TEXT } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useSession } from '@/entities/session'
import { useChangePassword } from '@/features/staff-manage'
import { applyServerErrors } from '@/shared/lib'
import {
  Button,
  Card,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/shared/ui'

const schema = z.object({
  currentPassword: z.string().min(1, AUTH_TEXT.password_too_short),
  newPassword: z.string().min(8, AUTH_TEXT.password_too_short).max(200),
})

type Values = z.infer<typeof schema>

/// Har bir xodim oʻz parolini shu yerda almashtiradi — hisobni egasi
/// ochgani uchun boshlangʻich parol uniki boʻladi
export function AccountTab() {
  const { data: session } = useSession()
  const { mutateAsync, isPending } = useChangePassword()
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '' },
  })

  async function onSubmit(values: Values) {
    setFormError('')
    setSaved(false)
    try {
      await mutateAsync(values)
      form.reset({ currentPassword: '', newPassword: '' })
      setSaved(true)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Card className="max-w-md p-4">
      <div>
        <h2 className="font-display font-semibold">{session?.user.fullName}</h2>
        <p className="text-muted-foreground text-sm">
          {session?.user.email} · {session?.role?.name}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{STAFF_UI.current_password}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{STAFF_UI.new_password}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}
          {saved && <p className="text-ok text-sm font-medium">{STAFF_UI.password_changed}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? UI_TEXT.loading : STAFF_UI.change_password}
          </Button>
        </form>
      </Form>
    </Card>
  )
}
