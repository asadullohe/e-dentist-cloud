import { formatMoney, STAFF_UI } from '@e-dentist/shared'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from '@/shared/ui'

/// Ish haqi sharti maydonlari (tz.md 15-boʻlim): oylik va foiz — maskalangan matn.
/// `showPercent` — assistentda yoʻq: unga ulush hisoblanmaydi (tz.md 20-boʻlim)
export function PayFields<T extends FieldValues & { salaryAmount: string; payPercent: string }>({
  control,
  showPercent = true,
}: {
  control: Control<T>
  showPercent?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField
        control={control}
        name={'salaryAmount' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{STAFF_UI.salary}</FormLabel>
            <FormControl>
              <Input
                inputMode="numeric"
                placeholder="0"
                {...field}
                onChange={(event) => field.onChange(formatMoney(event.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {showPercent && (
        <FormField
          control={control}
          name={'payPercent' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{STAFF_UI.percent}</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  {...field}
                  onChange={(event) =>
                    field.onChange(event.target.value.replace(/\D/g, '').slice(0, 3))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
