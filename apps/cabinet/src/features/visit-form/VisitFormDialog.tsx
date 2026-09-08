import {
  CARD_UI,
  formatDate,
  formatMoney,
  formatSom,
  maskDisplayDate,
  moneyDigits,
  parseDisplayDate,
  SERVICE_UI,
  UI_TEXT,
} from '@e-dentist/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useServices } from '@/entities/service'
import type { Visit } from '@/entities/visit'
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/shared/ui'
import { useSaveVisit } from './hooks'
import { EMPTY_VISIT, type VisitValues, visitSchema } from './model'

interface VisitFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  patientId: string
  /// Boʻsh boʻlsa — yangi tashrif
  visit?: Visit | undefined
}

function toValues(visit: Visit | undefined): VisitValues {
  if (!visit) return { ...EMPTY_VISIT, date: formatDate(new Date().toISOString().slice(0, 10)) }
  return {
    date: formatDate(visit.date.slice(0, 10)),
    treatment: visit.treatment,
    tooth: visit.tooth === null ? '' : String(visit.tooth),
    price: formatMoney(String(visit.price)),
    note: visit.note ?? '',
  }
}

export function VisitFormDialog({ open, onOpenChange, patientId, visit }: VisitFormDialogProps) {
  const { mutateAsync, isPending } = useSaveVisit(visit?.id ?? null)
  const { data: services } = useServices()
  const [formError, setFormError] = useState('')
  const [serviceId, setServiceId] = useState<string | null>(null)

  const form = useForm<VisitValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: toValues(visit),
  })

  // Oyna qayta ochilganda maydonlar tanlangan tashrifga moslanadi
  useEffect(() => {
    if (open) {
      form.reset(toValues(visit))
      setFormError('')
      setServiceId(visit?.serviceId ?? null)
    }
  }, [open, visit, form])

  async function onSubmit(values: VisitValues) {
    setFormError('')
    try {
      await mutateAsync({
        ...(visit ? {} : { patientId }),
        date: parseDisplayDate(values.date) as string,
        treatment: values.treatment,
        tooth: values.tooth ? Number(values.tooth) : null,
        serviceId,
        price: Number(moneyDigits(values.price) || 0),
        note: values.note || null,
      })
      onOpenChange(false)
    } catch (error) {
      setFormError(applyServerErrors(form, error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{visit ? CARD_UI.edit_visit : CARD_UI.add_visit}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CARD_UI.date}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="01/09/2026"
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
                name="tooth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CARD_UI.tooth}</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {services && services.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="visit-service">{SERVICE_UI.pick}</Label>
                <Select
                  value={serviceId ?? ''}
                  onValueChange={(id) => {
                    // Narxnomadan tanlash — muolaja nomi va narxni toʻldiradi.
                    // Ikkalasi ham keyin qoʻlda oʻzgartirilishi mumkin:
                    // tashrifda ular matn va son sifatida saqlanadi
                    setServiceId(id)
                    const picked = services.find((item) => item.id === id)
                    if (picked) {
                      form.setValue('treatment', picked.name)
                      form.setValue('price', formatMoney(String(picked.price)))
                    }
                  }}
                >
                  <SelectTrigger id="visit-service" className="w-full">
                    <SelectValue placeholder={SERVICE_UI.pick_placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} · {formatSom(item.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{CARD_UI.treatment}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{CARD_UI.price}</FormLabel>
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

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{CARD_UI.note}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
