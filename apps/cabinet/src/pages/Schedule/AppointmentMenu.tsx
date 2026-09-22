import { APPOINTMENT_STATUS_LABELS, SCHEDULE_UI, UI_TEXT } from '@e-dentist/shared'
import { CheckIcon, PencilIcon, Trash2Icon, UserIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Appointment, AppointmentStatus } from '@/entities/appointment'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui'
import { STATUSES } from './scheduleUtils'

export interface AppointmentActions {
  onStatus: (item: Appointment, status: AppointmentStatus) => void
  onComplete: (item: Appointment) => void
  onEdit: (item: Appointment) => void
  onDelete: (item: Appointment) => void
}

/// Qabul amallari menyusi — kunlik roʻyxatda ham, vaqt toʻridagi blokda ham
/// bitta. «Yakunlandi» tashrif formasini ochadi (10.6)
export function AppointmentMenu({
  item,
  actions,
  children,
  open,
  onOpenChange,
}: {
  item: Appointment
  actions: AppointmentActions
  children: ReactNode
  /// Toʻrda blok sudraladi — menyu bosilganda emas, qoʻyib yuborilganda
  /// (sudralmagan boʻlsa) ochiladi; shuning uchun boshqaruv tashqarida
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{SCHEDULE_UI.set_status}</DropdownMenuLabel>
        {STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            disabled={status === item.status}
            onClick={() =>
              status === 'done' ? actions.onComplete(item) : actions.onStatus(item, status)
            }
          >
            <span className="flex-1">{APPOINTMENT_STATUS_LABELS[status]}</span>
            {status === item.status && <CheckIcon className="size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`/patients/${item.patientId}`}>
            <UserIcon />
            {SCHEDULE_UI.open_card}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onEdit(item)}>
          <PencilIcon />
          {UI_TEXT.edit}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => actions.onDelete(item)}>
          <Trash2Icon />
          {UI_TEXT.remove}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
