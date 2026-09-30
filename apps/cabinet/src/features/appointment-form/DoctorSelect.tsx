import { SCHEDULE_UI } from '@e-dentist/shared'
import type { Control, FieldValues, Path } from 'react-hook-form'
import type { DoctorName } from '@/entities/staff'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'

/// Radix Select boʻsh satrni qabul qilmaydi — «shifokorsiz» uchun belgi
const NO_DOCTOR = '__none__'

interface DoctorSelectProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  /// Allaqachon koʻruvchi doirasiga toraytirilgan roʻyxat (tz.md 20-boʻlim)
  doctors: DoctorName[]
  /// «Shifokorsiz» varianti — faqat hamma shifokorni koʻradiganga
  noneLabel?: string | undefined
}

/// Qabul va band vaqt oynalaridagi shifokor tanlovi
export function DoctorSelect<T extends FieldValues>({
  control,
  name,
  doctors,
  noneLabel,
}: DoctorSelectProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{SCHEDULE_UI.doctor}</FormLabel>
          <Select
            value={field.value || (noneLabel ? NO_DOCTOR : '')}
            onValueChange={(value) => field.onChange(value === NO_DOCTOR ? '' : value)}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={SCHEDULE_UI.doctor} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {noneLabel && <SelectItem value={NO_DOCTOR}>{noneLabel}</SelectItem>}
              {doctors.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
