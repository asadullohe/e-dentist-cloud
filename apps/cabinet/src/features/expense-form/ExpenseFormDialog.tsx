import {
  CARD_UI,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_TEXT,
  EXPENSE_UI,
  formatDate,
  formatMoney,
  maskDisplayDate,
  moneyDigits,
  parseDisplayDate,
  UI_TEXT,
  VALIDATION_TEXT,
} from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Expense, ExpenseCategory } from '@/entities/expense'
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
import { useSaveExpense } from './hooks'

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, ...ExpenseCategory[]]

const schema = z.object({
  /// Ekranda DD/MM/YYYY, serverga YYYY-MM-DD
  date: z
    .string()
    .trim()
    .refine((value) => parseDisplayDate(value) !== null, VALIDATION_TEXT.date_invalid),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(2, EXPENSE_TEXT.description_required).max(300),
  /// Maskalangan matn: «250 000»
  amount: z
    .string()
    .refine((value) => Number(moneyDigits(value)) > 0, EXPENSE_TEXT.amount_required),
})

type Values = z.infer<typeof schema>

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  /// Yangi xarajat uchun boshlangʻich sana — koʻrilayotgan oyning kuni
  defaultDate: string
  expense?: Expense | undefined
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  defaultDate,
  expense,
}: ExpenseFormDialogProps) {
  const { mutateAsync, isPending } = useSaveExpense(expense?.id ?? null)
  const [formError, setFormError] = useState('')

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { date: '', category: 'materials', description: '', amount: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        date: formatDate(expense?.date ?? defaultDate),
        category: expense?.category ?? 'materials',
        description: expense?.description ?? '',
        amount: expense ? formatMoney(String(expense.amount)) : '',
      })
      setFormError('')
    }
  }, [open, expense, defaultDate, form])

  async function onSubmit(values: Values) {
    setFormError('')
    try {
      await mutateAsync({
        // schema tekshirgan: bu yerda null qaytmaydi
        date: parseDisplayDate(values.date) as string,
        category: values.category,
        description: values.description,
        amount: Number(moneyDigits(values.amount)),
      })
      onOpenChange(false)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? EXPENSE_UI.edit : EXPENSE_UI.add}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{EXPENSE_UI.date}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="15/09/2026"
                        {...field}
                        onChange={(event) => field.onChange(maskDisplayDate(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{EXPENSE_UI.category}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((key) => (
                          <SelectItem key={key} value={key}>
                            {EXPENSE_CATEGORY_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{EXPENSE_UI.description}</FormLabel>
                  <FormControl>
                    <Input placeholder={EXPENSE_UI.description_hint} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{EXPENSE_UI.amount}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      {...field}
                      onChange={(event) => field.onChange(formatMoney(event.target.value))}
                    />
                  </FormControl>
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
                {isPending ? UI_TEXT.loading : CARD_UI.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
