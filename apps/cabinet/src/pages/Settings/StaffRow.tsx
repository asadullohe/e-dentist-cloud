import { formatDateTime, formatPayTerms, roleLabel, STAFF_UI } from '@e-dentist/shared'
import { PencilIcon, UserCheckIcon, UserXIcon } from 'lucide-react'
import type { Role, StaffMember, StaffStatus } from '@/entities/staff'
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableCell,
  TableRow,
} from '@/shared/ui'

interface StaffRowProps {
  person: StaffMember
  isSelf: boolean
  roles: Role[]
  /// Assistent ostida shifokorlari koʻrsatiladi. Individualda yoʻq —
  /// shifokor bitta, egasining oʻzi
  doctorNames: Map<string, string> | null
  onRole(roleId: string): void
  onStatus(status: StaffStatus): void
  onPay(): void
  onDoctors(): void
}

export function StaffRow({
  person,
  isSelf,
  roles,
  doctorNames,
  onRole,
  onStatus,
  onPay,
  onDoctors,
}: StaffRowProps) {
  const payTerms = formatPayTerms(person.salaryAmount, person.payPercent)
  const doctors = person.doctorIds.map((id) => doctorNames?.get(id)).filter(Boolean)

  return (
    <TableRow>
      <TableCell className="font-medium whitespace-normal">
        {person.fullName ?? '—'}
        {isSelf && (
          <Badge variant="secondary" className="ml-2">
            {STAFF_UI.you}
          </Badge>
        )}
        <span className="text-muted-foreground block text-xs">{person.email}</span>
        {doctorNames && person.roleTemplate === 'assistent' && (
          <button
            type="button"
            onClick={onDoctors}
            className="text-primary mt-0.5 block text-left text-xs font-normal hover:underline"
          >
            {doctors.length > 0 ? STAFF_UI.assistant_of(doctors.join(', ')) : STAFF_UI.doctors_none}
            {/* Inline: matn oʻralsa ham qalamcha oxirgi soʻz yonida qoladi */}
            <PencilIcon className="ml-1 inline size-3 align-[-1px]" aria-hidden="true" />
          </button>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground hidden xl:table-cell">
        {person.lastLoginAt ? formatDateTime(person.lastLoginAt) : STAFF_UI.never}
      </TableCell>
      <TableCell>
        <Select value={person.roleId ?? ''} disabled={isSelf} onValueChange={onRole}>
          <SelectTrigger className="w-full" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {roleLabel(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {/* Ish haqi sharti: oylik va/yoki foiz. Oʻzinikini ham
            oʻzgartira oladi — egasi shifokor boʻlishi mumkin */}
        <button
          type="button"
          className="hover:bg-muted -mx-2 flex items-center gap-2 rounded-md px-2 py-1 text-left"
          aria-label={STAFF_UI.pay_title(person.fullName ?? '')}
          onClick={onPay}
        >
          {payTerms ? (
            <span className="tabular-nums">{payTerms}</span>
          ) : (
            <span className="text-muted-foreground">{STAFF_UI.pay_none}</span>
          )}
          <PencilIcon className="text-muted-foreground size-3.5" aria-hidden="true" />
        </button>
      </TableCell>
      <TableCell className="text-right">
        {/* Tor ekranda faqat belgi qoladi — jadval siljimasin */}
        {person.status === 'active' ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={isSelf}
            aria-label={STAFF_UI.disable}
            onClick={() => onStatus('disabled')}
          >
            <UserXIcon />
            <span className="hidden xl:inline">{STAFF_UI.disable}</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            aria-label={STAFF_UI.enable}
            onClick={() => onStatus('active')}
          >
            <UserCheckIcon />
            <span className="hidden xl:inline">{STAFF_UI.enable}</span>
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
