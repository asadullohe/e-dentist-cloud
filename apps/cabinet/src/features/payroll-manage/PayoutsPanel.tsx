import {
  CARD_UI,
  formatDate,
  formatMoney,
  formatSom,
  moneyDigits,
  PAYROLL_TEXT,
  PAYROLL_UI,
  parseDisplayDate,
  todayISO,
  UI_TEXT,
  VALIDATION_TEXT,
} from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Payout, PayrollRow } from '@/entities/payroll'
import { applyServerErrors } from '@/shared/lib'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DatePicker,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/shared/ui'
import { useCreatePayout, useDeletePayout } from './hooks'

const schema = z.object({
  /// Maskalangan matn: «1 500 000»
  amount: z
    .string()
    .trim()
    .refine((value) => Number(moneyDigits(value)) > 0, {
      error: () => PAYROLL_TEXT.amount_required,
    }),
  // Ekranda KK/OO/YYYY, serverga YYYY-MM-DD
  date: z
    .string()
    .trim()
    .refine((value) => parseDisplayDate(value) !== null, {
      error: () => VALIDATION_TEXT.date_invalid,
    }),
  note: z.string().trim().max(300),
})

type Values = z.infer<typeof schema>

interface PayoutsPanelProps {
  month: string
  row: PayrollRow
  /// Ochilganda summa maydoniga fokus — «Toʻlash» tugmasidan kelinganda
  autoFocus?: boolean
}

/// Sukut summa — qoldiq: koʻpincha butunlay toʻlanadi, qisman boʻlsa
/// egasi oʻzi kamaytiradi
function toValues(remaining: number): Values {
  return {
    amount: remaining > 0 ? formatMoney(String(remaining)) : '',
    date: formatDate(todayISO()),
    note: '',
  }
}

/// Xodimga pul berish: toʻlovlar roʻyxati + yangisini yozish. Har toʻlov
/// «Oylik» turkumida xarajatga tushadi (tz.md 15-boʻlim). Xodim varagʻining
/// «Toʻlovlar» boʻlimi
export function PayoutsPanel({ month, row, autoFocus = false }: PayoutsPanelProps) {
  const { mutateAsync: create, isPending } = useCreatePayout()
  const { mutateAsync: remove } = useDeletePayout()
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting] = useState<Payout | null>(null)

  // Toʻlovdan keyin (qoldiq oʻzgardi) forma yangilanadi. `row` obyekti har
  // soʻrovda yangi — shuning uchun faqat qoldiqqa qaraladi
  const remaining = row.remaining

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(remaining),
  })

  useEffect(() => {
    form.reset(toValues(remaining))
    setFormError('')
  }, [remaining, form])

  async function onSubmit(values: Values) {
    setFormError('')
    try {
      await create({
        month,
        userId: row.userId,
        amount: Number(moneyDigits(values.amount)),
        date: parseDisplayDate(values.date) as string,
        note: values.note || null,
      })
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">{PAYROLL_UI.pay_hint}</p>

      {row.payouts.length > 0 ? (
        <ul className="divide-y rounded-md border text-sm">
          {row.payouts.map((payout) => (
            <li key={payout.id} className="flex items-center gap-3 px-3 py-2">
              <span className="text-muted-foreground w-24 shrink-0 tabular-nums">
                {formatDate(payout.date)}
              </span>
              <span className="min-w-0 flex-1 truncate">{payout.note}</span>
              <span className="font-semibold tabular-nums">{formatSom(payout.amount)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={PAYROLL_UI.delete_payout}
                onClick={() => setDeleting(payout)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{PAYROLL_UI.payouts_empty}</p>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{PAYROLL_UI.amount}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      autoFocus={autoFocus}
                      {...field}
                      onChange={(event) => field.onChange(formatMoney(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{PAYROLL_UI.pay_date}</FormLabel>
                  <FormControl>
                    <DatePicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{PAYROLL_UI.note}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? UI_TEXT.loading : PAYROLL_UI.add_payout}
          </Button>
        </form>
      </Form>

      <AlertDialog open={deleting !== null} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{PAYROLL_UI.delete_payout_title}</AlertDialogTitle>
            <AlertDialogDescription>{PAYROLL_UI.delete_payout_text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleting) await remove(deleting.id)
                setDeleting(null)
              }}
            >
              {PAYROLL_UI.delete_payout}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
