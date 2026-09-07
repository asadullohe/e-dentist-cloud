import { UI_TEXT } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { type LoginValues, loginSchema, useLogin } from '@/features/auth'
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

export function Login() {
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useLogin()
  const [formError, setFormError] = useState('')

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginValues) {
    setFormError('')
    try {
      await mutateAsync(values)
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <AuthLayout
      footer={
        <>
          {UI_TEXT.no_account}{' '}
          <Link to="/register" className="text-primary hover:underline">
            {UI_TEXT.register}
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
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
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? UI_TEXT.loading : UI_TEXT.login}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
