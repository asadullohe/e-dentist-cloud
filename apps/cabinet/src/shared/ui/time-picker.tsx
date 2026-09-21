import { maskDisplayTime, UI_TEXT } from '@e-dentist/shared'
import { cn } from 'cn'
import { ClockIcon } from 'lucide-react'
import type * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

const pad = (n: number) => String(n).padStart(2, '0')
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i))
/// Roʻyxatda besh daqiqalik qadam — aniq daqiqa qoʻlda yoziladi
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5))

interface TimePickerProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  /// «SS:DD» yoki boʻsh — forma shu shaklda saqlaydi, server ham shuni oladi
  value: string
  onChange: (value: string) => void
}

/// Vaqt maydoni — sana maydoni bilan bir uslubda: qoʻlda yozish (maska
/// ikki nuqtani oʻzi qoʻyadi) yoki oʻngdagi tugma orqali soat va daqiqa
/// roʻyxatidan tanlash. Doim 24 soat: brauzerning oʻz vaqt maydoni tilga
/// qarab AM/PM koʻrsatardi
export function TimePicker({
  value,
  onChange,
  className,
  disabled,
  placeholder,
  ...inputProps
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [hour = '', minute = ''] = value.split(':')

  return (
    <div className={cn('relative', className)}>
      <Input
        inputMode="numeric"
        placeholder={placeholder ?? UI_TEXT.time_placeholder}
        value={value}
        onChange={(event) => onChange(maskDisplayTime(event.target.value))}
        disabled={disabled}
        className="pr-9 tabular-nums"
        {...inputProps}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={UI_TEXT.pick_time}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
          >
            <ClockIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex w-auto gap-1 p-1">
          <Column
            items={HOURS}
            selected={hour}
            onPick={(h) => onChange(`${h}:${minute.length === 2 ? minute : '00'}`)}
          />
          <Column
            items={MINUTES}
            selected={minute}
            onPick={(m) => {
              onChange(`${hour.length === 2 ? hour : pad(new Date().getHours())}:${m}`)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/// Aylanadigan ustun; ochilganda tanlangani koʻrinadigan joyga suriladi
function Column({
  items,
  selected,
  onPick,
}: {
  items: readonly string[]
  selected: string
  onPick: (value: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // scrollIntoView emas: u ota elementlarni (sahifa, oyna) ham suradi —
  // faqat ustunning oʻz scrollTop i
  useEffect(() => {
    const list = ref.current
    const active = list?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (list && active)
      list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.offsetHeight / 2
  }, [])
  return (
    <div
      ref={ref}
      className="max-h-56 w-14 overflow-y-auto overscroll-contain [scrollbar-width:thin]"
    >
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={item === selected}
          onClick={() => onPick(item)}
          className={cn(
            'block w-full rounded-md px-2 py-1.5 text-center text-sm tabular-nums transition-colors',
            item === selected
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
}
