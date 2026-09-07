import { formatUzPhone, UI_TEXT } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { type RegisterValues, registerSchema, useRegister } from '@/features/auth'
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
} from '@/shared/ui'

export function Register() {
  const { mutateAsync, isPending, isSuccess } = useRegister()
  const [formError, setFormError] = useState('')

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { clinicName: '', phone: '', fullName: '', email: '', password: '' },
  })

  async function onSubmit(values: RegisterValues) {
    setFormError('')
    try {
      await mutateAsync({ ...values, phone: values.phone || undefined })
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout
        centered
        footer={
          <Link to="/login" className="text-primary hover:underline">
            {UI_TEXT.login}
          </Link>
        }
      >
        <div className="text-4xl">📬</div>
        <h2 className="font-display mt-2.5 text-lg font-semibold">{UI_TEXT.mail_sent}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{UI_TEXT.mail_sent_hint}</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      footer={
        <>
          {UI_TEXT.have_account}{' '}
          <Link to="/login" className="text-primary hover:underline">
            {UI_TEXT.login}
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
          <FormField
            control={form.control}
            name="clinicName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{UI_TEXT.clinic_name}</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>{UI_TEXT.phone}</FormLabel>
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
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{UI_TEXT.full_name}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{UI_TEXT.email}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
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
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? UI_TEXT.sending : UI_TEXT.register}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
