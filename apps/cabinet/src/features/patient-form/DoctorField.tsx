import { PATIENT_UI } from '@e-dentist/shared'
import type { Control } from 'react-hook-form'
import type { DoctorName } from '@/entities/staff'
import {
  FormControl,
  FormDescription,
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
import type { PatientValues } from './model'

/// Radix Select boʻsh satrni qabul qilmaydi — «biriktirilmagan» uchun belgi
const NO_DOCTOR = '__none__'

/// Biriktirilgan shifokor (tz.md 14-boʻlim). Roʻyxat koʻruvchi doirasiga
/// toraytirilgan boʻlib keladi (tz.md 20-boʻlim)
export function DoctorField({
  control,
  doctors,
}: {
  control: Control<PatientValues>
  doctors: DoctorName[]
}) {
  return (
    <FormField
      control={control}
      name="doctorId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{PATIENT_UI.doctor}</FormLabel>
          <Select
            value={field.value || NO_DOCTOR}
            onValueChange={(value) => field.onChange(value === NO_DOCTOR ? '' : value)}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NO_DOCTOR}>{PATIENT_UI.doctor_none}</SelectItem>
              {doctors.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>{PATIENT_UI.doctor_hint}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
