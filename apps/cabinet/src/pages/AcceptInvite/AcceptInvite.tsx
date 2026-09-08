import { AUTH_TEXT, STAFF_UI, UI_TEXT } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { SESSION_QUERY_KEY } from '@/entities/session'
import { useAcceptInvite, useInvite } from '@/features/staff-manage'
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

const schema = z.object({
  fullName: z.string().trim().min(3, AUTH_TEXT.full_name_too_short).max(120),
  password: z.string().min(8, AUTH_TEXT.password_too_short).max(200),
})

type Values = z.infer<typeof schema>

export function AcceptInvite() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: invite, isPending, isError } = useInvite(token)
  const { mutateAsync, isPending: isSaving } = useAcceptInvite()
  const [formError, setFormError] = useState('')

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', password: '' },
  })

  async function onSubmit(values: Values) {
    setFormError('')
    try {
      await mutateAsync({ token, ...values })
      // Sessiya darhol ochiladi — kabinetga oʻtamiz
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(error instanceof ApiError ? applyServerErrors(form, error) : UI_TEXT.offline)
    }
  }

  if (isPending) {
    return (
      <AuthLayout centered>
        <Skeleton className="h-9 w-40" />
      </AuthLayout>
    )
  }

  if (isError || !invite) {
    return (
      <AuthLayout
        centered
        footer={
          <Link to="/login" className="text-primary hover:underline">
            {UI_TEXT.login}
          </Link>
        }
      >
        <div className="text-4xl">⚠️</div>
        <p className="text-destructive mt-2.5 text-sm font-medium">{STAFF_UI.accept_invalid}</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      footer={
        <Link to="/login" className="text-primary hover:underline">
          {UI_TEXT.login}
        </Link>
      }
    >
      <h1 className="font-display text-xl font-bold tracking-tight">{STAFF_UI.accept_title}</h1>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">
        {STAFF_UI.accept_hint(invite.clinicName, invite.roleName)}
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
          <div className="space-y-1.5">
            <FormLabel>{UI_TEXT.email}</FormLabel>
            <Input value={invite.email} readOnly disabled />
          </div>

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{UI_TEXT.full_name}</FormLabel>
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
                <FormLabel>{UI_TEXT.password}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? UI_TEXT.sending : STAFF_UI.accept_button}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
