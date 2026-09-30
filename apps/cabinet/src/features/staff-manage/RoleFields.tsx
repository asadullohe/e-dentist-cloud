import { roleLabel, STAFF_UI } from '@e-dentist/shared'
import type { Control } from 'react-hook-form'
import type { Role } from '@/entities/staff'
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
import { DoctorPicker } from './DoctorPicker'
import type { StaffValues } from './staffSchema'

interface RoleFieldsProps {
  control: Control<StaffValues>
  roles: Role[]
  solo: boolean
  isAssistant: boolean
}

/// Rol va — assistent boʻlsa — uning shifokorlari (tz.md 20-boʻlim).
/// Individualda tanlov yoʻq: faqat assistent, shifokori egasining oʻzi
export function RoleFields({ control, roles, solo, isAssistant }: RoleFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="roleId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{STAFF_UI.role}</FormLabel>
            {solo ? (
              <p className="text-sm">{STAFF_UI.solo_role}</p>
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={STAFF_UI.role} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {roleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      {isAssistant && !solo && (
        <FormField
          control={control}
          name="doctorIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{STAFF_UI.doctors}</FormLabel>
              <DoctorPicker value={field.value} onChange={field.onChange} idPrefix="new-staff" />
              <FormDescription>{STAFF_UI.doctors_hint}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  )
}
