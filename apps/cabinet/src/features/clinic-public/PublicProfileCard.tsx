import { FEEDBACK_CABINET_UI, FEEDBACK_TEXT, PATIENT_UI } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useSession } from '@/entities/session'
import { applyServerErrors } from '@/shared/lib'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Skeleton,
} from '@/shared/ui'
import { useSavePublicProfile } from './hooks'

const schema = z.object({
  publicPhone: z.string().trim().max(30),
  address: z.string().trim().max(200),
  reviewUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === '' || /^https?:\/\//i.test(value), {
      error: () => FEEDBACK_TEXT.bad_url,
    }),
})

type Values = z.infer<typeof schema>

/// Sozlamalar → Fikrlar: bemor sahifasidagi telefon, manzil va xaritadagi
/// sharh havolasi. Boʻsh maydon — «koʻrsatilmaydi»
export function PublicProfileCard() {
  const { data: session } = useSession()
  const { mutateAsync, isPending } = useSavePublicProfile()
  const [formError, setFormError] = useState('')

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { publicPhone: '', address: '', reviewUrl: '' },
  })

  const clinic = session?.clinic
  useEffect(() => {
    if (clinic) {
      form.reset({
        publicPhone: clinic.publicPhone ?? '',
        address: clinic.address ?? '',
        reviewUrl: clinic.reviewUrl ?? '',
      })
    }
  }, [clinic, form])

  if (!clinic) return <Skeleton className="h-48 w-full" />

  async function onSubmit(values: Values) {
    setFormError('')
    try {
      await mutateAsync({
        publicPhone: values.publicPhone || null,
        address: values.address || null,
        reviewUrl: values.reviewUrl || null,
      })
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{FEEDBACK_CABINET_UI.settings_title}</CardTitle>
        <CardDescription>{FEEDBACK_CABINET_UI.hint}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="publicPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{FEEDBACK_CABINET_UI.public_phone}</FormLabel>
                  <FormControl>
                    <Input inputMode="tel" placeholder="+998 71 200 00 00" {...field} />
                  </FormControl>
                  <FormDescription>{FEEDBACK_CABINET_UI.public_phone_hint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{FEEDBACK_CABINET_UI.address}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>{FEEDBACK_CABINET_UI.address_hint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reviewUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{FEEDBACK_CABINET_UI.review_url}</FormLabel>
                  <FormControl>
                    <Input inputMode="url" placeholder="https://maps.app.goo.gl/…" {...field} />
                  </FormControl>
                  <FormDescription>{FEEDBACK_CABINET_UI.review_url_hint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}

            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? PATIENT_UI.saving : PATIENT_UI.save}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
