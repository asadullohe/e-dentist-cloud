import { STAFF_UI } from '@e-dentist/shared'
import { useDoctors } from '@/entities/staff'
import { Checkbox, Label, Skeleton } from '@/shared/ui'

interface DoctorPickerProps {
  value: string[]
  onChange(value: string[]): void
  /// Id lar takrorlanmasin — bir oynada ikki marta ishlatilsa
  idPrefix: string
}

/// Assistent kimga yordam beradi — bir nechta shifokor (tz.md 20-boʻlim)
export function DoctorPicker({ value, onChange, idPrefix }: DoctorPickerProps) {
  const { data: doctors, isPending } = useDoctors()

  if (isPending) return <Skeleton className="h-16 w-full" />
  if (!doctors?.length) {
    return <p className="text-muted-foreground text-sm">{STAFF_UI.doctors_none}</p>
  }

  function toggle(id: string, on: boolean) {
    onChange(on ? [...value, id] : value.filter((item) => item !== id))
  }

  return (
    <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border p-3">
      {doctors.map((doctor) => {
        const id = `${idPrefix}-${doctor.id}`
        return (
          <div key={doctor.id} className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={value.includes(doctor.id)}
              onCheckedChange={(state) => toggle(doctor.id, state === true)}
            />
            <Label htmlFor={id} className="text-sm font-normal">
              {doctor.fullName}
            </Label>
          </div>
        )
      })}
    </div>
  )
}
