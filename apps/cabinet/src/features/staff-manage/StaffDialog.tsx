import { CARD_UI, moneyDigits, STAFF_TEXT, STAFF_UI, UI_TEXT } from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useSession } from '@/entities/session'
import { useRoles } from '@/entities/staff'
import { ApiError } from '@/shared/api'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/shared/ui'
import { useCreateStaff } from './hooks'
import { PayFields } from './PayFields'
import { RoleFields } from './RoleFields'
import { EMPTY_STAFF, type StaffValues, staffSchema } from './staffSchema'

interface StaffDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  /// Individual kabinet chegarasi — server `upgrade_required` qaytardi
  onUpgradeRequired(): void
}

/// Xodim hisobini egasi ochadi va parolni oʻzi belgilaydi — pochta
/// tasdiqlash oqimi bu yerda yoʻq.
/// Individualda rol tanlovi yoʻq: faqat assistent, shifokori — egasi
export function StaffDialog({ open, onOpenChange, onUpgradeRequired }: StaffDialogProps) {
  const { data: session } = useSession()
  const { data: roles } = useRoles()
  const { mutateAsync, isPending } = useCreateStaff()
  const [formError, setFormError] = useState('')

  const solo = session?.clinic?.kind === 'solo'
  const assistantRoleId = roles?.find((role) => role.template === 'assistent')?.id ?? ''

  const form = useForm<StaffValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: EMPTY_STAFF,
  })
  const roleId = useWatch({ control: form.control, name: 'roleId' })
  const isAssistant = roleId !== '' && roleId === assistantRoleId

  useEffect(() => {
    if (open) {
      form.reset(EMPTY_STAFF)
      setFormError('')
    }
  }, [open, form])

  // Alohida: rollar oyna ochilgandan keyin kelsa, yozilgan matn oʻchmasin
  useEffect(() => {
    if (open && solo && assistantRoleId) form.setValue('roleId', assistantRoleId)
  }, [open, solo, assistantRoleId, form])

  async function onSubmit(values: StaffValues) {
    setFormError('')
    const needsDoctors = isAssistant && !solo
    if (needsDoctors && values.doctorIds.length === 0) {
      form.setError('doctorIds', { message: STAFF_TEXT.doctors_required })
      return
    }
    try {
      await mutateAsync({
        email: values.email,
        fullName: values.fullName,
        roleId: values.roleId,
        password: values.password,
        salaryAmount: Number(moneyDigits(values.salaryAmount) || 0),
        payPercent: isAssistant ? 0 : Number(values.payPercent || 0),
        ...(needsDoctors ? { doctorIds: values.doctorIds } : {}),
      })
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'upgrade_required') {
        onOpenChange(false)
        onUpgradeRequired()
        return
      }
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{STAFF_UI.add_title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{UI_TEXT.full_name}</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
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
                  <FormLabel>{STAFF_UI.email}</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <RoleFields
              control={form.control}
              roles={roles ?? []}
              solo={solo}
              isAssistant={isAssistant}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{STAFF_UI.password}</FormLabel>
                  <FormControl>
                    <Input type="text" autoComplete="off" {...field} />
                  </FormControl>
                  <FormDescription>{STAFF_UI.add_hint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PayFields control={form.control} showPercent={!isAssistant} />
            <FormDescription>{STAFF_UI.pay_optional_hint}</FormDescription>

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
