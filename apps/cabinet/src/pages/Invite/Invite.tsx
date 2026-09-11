import { INVITE_UI, UI_TEXT } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { type InviteValues, inviteSchema, useAcceptInvite, useInviteInfo } from '@/features/auth'
import { ApiError } from '@/shared/api'
import { applyServerErrors } from '@/shared/lib'
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Skeleton,
} from '@/shared/ui'

/// Panel klinika ochganda egasi shu sahifada parolini qoʻyadi.
/// Pochta havoladan keladi va oʻzgartirilmaydi — taklifnoma aynan
/// oʻsha manzilga yozilgan
export function Invite() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const { data: invite, isPending, isError, error } = useInviteInfo(token)
  const { mutateAsync, isPending: isSending } = useAcceptInvite()
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { fullName: '', password: '', passwordAgain: '' },
  })

  async function onSubmit(values: InviteValues) {
    setFormError('')
    try {
      await mutateAsync({ token, fullName: values.fullName, password: values.password })
      // Server sessiya ochdi — kabinetga oʻtamiz
      navigate('/', { replace: true })
    } catch (caught) {
      setFormError(applyServerErrors(form, caught))
    }
  }

  const loginLink = (
    <Link to="/login" className="text-primary hover:underline">
      {UI_TEXT.login}
    </Link>
  )

  if (isPending) {
    return (
      <AuthLayout centered footer={loginLink}>
        <Skeleton className="mx-auto h-9 w-9 rounded-full" />
        <p className="text-muted-foreground mt-2 text-sm">{INVITE_UI.checking}</p>
      </AuthLayout>
    )
  }

  if (isError || !invite) {
    return (
      <AuthLayout centered footer={loginLink}>
        <div className="text-4xl">⚠️</div>
        <p className="text-destructive mt-2.5 text-sm font-medium">
          {error instanceof ApiError ? error.message : UI_TEXT.offline}
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout footer={loginLink}>
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold">{INVITE_UI.title}</h2>
        <p className="text-muted-foreground text-sm">{INVITE_UI.hint(invite.clinicName)}</p>
        <p className="text-muted-foreground mt-1 text-sm">{invite.email}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{INVITE_UI.full_name}</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{INVITE_UI.password}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordAgain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{INVITE_UI.password_again}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}

          <Button type="submit" className="w-full" disabled={isSending}>
            {isSending ? UI_TEXT.sending : INVITE_UI.submit}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
