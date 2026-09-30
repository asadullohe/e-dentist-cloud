import { LAB_UI } from '@e-dentist/shared'
import { useLabs } from '@/entities/lab-order'
import { useSession } from '@/entities/session'
import { useStaffNames } from '@/entities/staff'
import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'

/// «Tanlanmagan» uchun boʻsh satr Radix Select da ishlamaydi
const NONE = 'none'

/// Naryad kimga: texnik (xodim) yoki tashqi laboratoriya (tz.md 20-boʻlim).
/// Bitta tanlovda — ikkalasi birga boʻlmaydi
export interface Assignee {
  techId: string | null
  labId: string | null
}

export function toAssignee(value: string): Assignee {
  if (value.startsWith('tech:')) return { techId: value.slice(5), labId: null }
  if (value.startsWith('lab:')) return { techId: null, labId: value.slice(4) }
  return { techId: null, labId: null }
}

export function fromAssignee(order: Assignee | undefined): string {
  if (order?.techId) return `tech:${order.techId}`
  if (order?.labId) return `lab:${order.labId}`
  return NONE
}

export function AssigneeSelect({
  value,
  onChange,
}: {
  value: string
  onChange(value: string): void
}) {
  const { data: session } = useSession()
  const { data: staff } = useStaffNames()
  const { data: labs } = useLabs()
  // Individualda texnik xodim yoʻq — xodimlar roʻyxati bu yerda maʼnosiz
  const showTechs = session?.clinic?.kind !== 'solo'

  return (
    <div className="space-y-1.5">
      <Label htmlFor="lab-assignee">{LAB_UI.assignee}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="lab-assignee" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{LAB_UI.tech_none}</SelectItem>
          {showTechs && !!staff?.length && (
            <SelectGroup>
              <SelectLabel>{LAB_UI.group_techs}</SelectLabel>
              {staff.map((person) => (
                <SelectItem key={person.id} value={`tech:${person.id}`}>
                  {person.fullName}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {!!labs?.length && (
            <SelectGroup>
              <SelectLabel>{LAB_UI.group_labs}</SelectLabel>
              {labs.map((lab) => (
                <SelectItem key={lab.id} value={`lab:${lab.id}`}>
                  {lab.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
