import {
  formatDate,
  getLocale,
  maskDisplayDate,
  parseDisplayDate,
  UI_TEXT,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { format } from 'date-fns'
import { ru, uz } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import type * as React from 'react'
import { useState } from 'react'
import { Button } from './button'
import { Calendar } from './calendar'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

/// Kalendar oy va hafta kunlarini ilova tilida koʻrsatadi
const CALENDAR_LOCALES = { uz, ru } as const

const pad = (n: number) => String(n).padStart(2, '0')

/// KK/OO/YYYY → Date (mahalliy yarim tun). Notoʻgʻri yoki chala sana — tanlov yoʻq
function toDate(value: string): Date | undefined {
  const iso = parseDisplayDate(value)
  if (!iso) return undefined
  return new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))
}

/// Date → KK/OO/YYYY. toISOString emas: UTC ga oʻtganda kun surilib ketadi
function fromDate(date: Date): string {
  return formatDate(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`)
}

interface DatePickerProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  /// Ekran shaklida: KK/OO/YYYY yoki boʻsh. Formalar shu shaklda saqlaydi,
  /// serverga joʻnatishda `parseDisplayDate` bilan ISO ga oʻtadi
  value: string
  onChange: (value: string) => void
  /// Yil va oy roʻyxatdan tanlanadi — tugʻilgan sana kabi uzoq oraliq uchun.
  /// Berilmasa faqat oʻq tugmalari bilan oy almashadi
  yearRange?: readonly [from: number, to: number]
}

/// Sana maydoni: qoʻlda yozish (maska oʻzi chiziqcha qoʻyadi) yoki oʻngdagi
/// tugma orqali kalendardan tanlash. Qabulxona tez yozadi, shifokor tanlaydi —
/// ikkalasi ham bir maydonda
export function DatePicker({
  value,
  onChange,
  yearRange,
  className,
  disabled,
  placeholder,
  ...inputProps
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = toDate(value)
  const locale = CALENDAR_LOCALES[getLocale()]

  return (
    <div className={cn('relative', className)}>
      <Input
        inputMode="numeric"
        placeholder={placeholder ?? UI_TEXT.date_placeholder}
        value={value}
        onChange={(event) => onChange(maskDisplayDate(event.target.value))}
        disabled={disabled}
        className="pr-9"
        {...inputProps}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={UI_TEXT.pick_date}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
          >
            <CalendarIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="single"
            locale={locale}
            selected={selected}
            defaultMonth={selected ?? new Date()}
            captionLayout={yearRange ? 'dropdown' : 'label'}
            startMonth={yearRange && new Date(yearRange[0], 0)}
            endMonth={yearRange && new Date(yearRange[1], 11)}
            formatters={{
              formatMonthDropdown: (date) => format(date, 'LLL', { locale }),
            }}
            onSelect={(date) => {
              if (date) onChange(fromDate(date))
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
