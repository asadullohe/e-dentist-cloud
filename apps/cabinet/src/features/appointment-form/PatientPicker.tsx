import { formatUzPhone, SCHEDULE_UI } from '@e-dentist/shared'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useState } from 'react'
import { usePatients } from '@/entities/patient'
import { useDebounced } from '@/shared/lib'
import {
  Button,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui'

interface PatientPickerProps {
  value: string | null
  label: string
  onPick(id: string, fio: string): void
}

/// Bemorni qidirib tanlash. Roʻyxat uzun boʻlishi mumkin, shuning uchun
/// oddiy select emas — server tomonidagi qidiruvga tayanadi
export function PatientPicker({ value, label, onPick }: PatientPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query, 300)
  const { data } = usePatients({ q: debounced, page: 1, pageSize: 20 })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
          aria-expanded={open}
        >
          {label || SCHEDULE_UI.pick_patient}
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={SCHEDULE_UI.pick_patient}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{SCHEDULE_UI.no_matches}</CommandEmpty>
            {data?.items.map((patient) => (
              <CommandItem
                key={patient.id}
                value={patient.id}
                onSelect={() => {
                  onPick(patient.id, patient.fio)
                  setOpen(false)
                }}
              >
                <CheckIcon className={value === patient.id ? 'opacity-100' : 'opacity-0'} />
                <span className="flex-1">{patient.fio}</span>
                {patient.phone && (
                  <span className="text-muted-foreground text-xs">
                    {formatUzPhone(patient.phone)}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
