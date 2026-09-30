import { type ClinicKind, defaultCabinetName, formatUzPhone, UI_TEXT } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { type Control, useForm, useWatch } from 'react-hook-form'
import { type RegisterInput, type RegisterValues, registerSchema } from '@/features/auth'
import { applyServerErrors } from '@/shared/lib'
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/shared/ui'

interface RegisterFormProps {
  kind: ClinicKind
  onChangeKind: () => void
  submit: (input: RegisterInput) => Promise<unknown>
  isPending: boolean
}

export function RegisterForm({ kind, onChangeKind, submit, isPending }: RegisterFormProps) {
  const [formError, setFormError] = useState('')

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { kind, clinicName: '', phone: '', fullName: '', email: '', password: '' },
  })

  async function onSubmit(values: RegisterValues) {
    setFormError('')
    try {
      await submit({ ...values, phone: values.phone || undefined })
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  const nameField = kind === 'solo' ? <CabinetNameField control={form.control} /> : null

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
        <button
          type="button"
          onClick={onChangeKind}
          className="text-muted-foreground hover:text-foreground -mt-1 flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          {kind === 'solo' ? UI_TEXT.kind_solo : UI_TEXT.kind_clinic}
          <span aria-hidden>·</span>
          <span className="underline-offset-2 hover:underline">{UI_TEXT.kind_change}</span>
        </button>

        {kind === 'clinic' && (
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
        )}
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
        {/* Individualda nom ismdan keyin: boʻsh qolsa shu ism olinadi */}
        {nameField}
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
  )
}

/// «Kabinet nomi (ixtiyoriy)» — boʻsh qolsa qanday nom boʻlishini oldindan
/// koʻrsatadi, shunda «Dr. …» kutilmagan narsa boʻlib chiqmaydi
function CabinetNameField({ control }: { control: Control<RegisterValues> }) {
  const fullName = useWatch({ control, name: 'fullName' })
  const fallback = fullName.trim() ? defaultCabinetName(fullName) : ''

  return (
    <FormField
      control={control}
      name="clinicName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {UI_TEXT.cabinet_name}
            <span className="text-muted-foreground font-normal">({UI_TEXT.optional})</span>
          </FormLabel>
          <FormControl>
            <Input placeholder={fallback} {...field} />
          </FormControl>
          {fallback && !field.value.trim() && (
            <FormDescription>{UI_TEXT.cabinet_name_hint(fallback)}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
