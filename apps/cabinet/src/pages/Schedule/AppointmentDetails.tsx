import {
  APPOINTMENT_STATUS_LABELS,
  age,
  formatDate,
  formatSom,
  formatUzPhone,
  PATIENT_UI,
  PAYMENT_UI,
  SCHEDULE_UI,
  UI_TEXT,
} from '@e-dentist/shared'
import { cn } from 'cn'
import {
  CircleCheckIcon,
  ClockIcon,
  NotebookPenIcon,
  PhoneIcon,
  StethoscopeIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Appointment, AppointmentStatus } from '@/entities/appointment'
import { usePatient } from '@/entities/patient'
import { useBalance } from '@/entities/payment'
import { useHasPermission } from '@/entities/session'
import { initialsOf, useMediaQuery } from '@/shared/lib'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/shared/ui'
import { endTimeOf, statusTone, timeOf } from './scheduleUtils'

export interface AppointmentActions {
  onStatus: (item: Appointment, status: AppointmentStatus) => void
  /// «Yakunlash» — tashrif formasini ochadi (10.6)
  onComplete: (item: Appointment) => void
  onEdit: (item: Appointment) => void
}

/// Bir bosishda qoʻyiladigan holatlar. «Yakunlandi» bu yerda yoʻq — u
/// tashrif yozishni talab qiladi, shuning uchun alohida tugma
const CHIPS: AppointmentStatus[] = ['scheduled', 'arrived', 'no_show', 'cancelled']

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof ClockIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="ml-auto max-w-[60%] text-right text-sm">{children}</span>
    </div>
  )
}

/// Qabul tafsiloti: kompyuterda oyna, telefonda pastdan tortma. Holat bir
/// bosishda oʻzgaradi; qabul oʻchirilmaydi — bekor qilinadi (11-bosqichdagi
/// toʻlov qoidasining oʻzi)
export function AppointmentDetails({
  item,
  onClose,
  actions,
}: {
  item: Appointment | null
  onClose: () => void
  actions: AppointmentActions
}) {
  const wide = useMediaQuery('(min-width: 768px)')
  const can = useHasPermission()
  const canWrite = can('schedule.write')
  // Qarz — qabulxona bemorni kutib olishdan oldin koʻradi
  const { data: balance } = useBalance(can('payments.read') ? item?.patientId : undefined)
  const { data: patient } = usePatient(can('patients.read') ? (item?.patientId ?? null) : null)

  if (!item) return null

  const years = age(patient?.birthDate)
  const tone = statusTone(item.status)
  const done = item.status === 'done' || item.status === 'cancelled'

  const body = (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          {initialsOf(item.fio)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{item.fio}</div>
          {years !== null && (
            <div className="text-muted-foreground text-xs">{PATIENT_UI.years(years)}</div>
          )}
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', tone.badge)}>
          {APPOINTMENT_STATUS_LABELS[item.status]}
        </span>
      </div>

      {(item.fromQueue || (balance ? balance.debt !== 0 : false)) && (
        <div className="-mt-1 flex flex-wrap gap-1.5">
          {item.fromQueue && (
            <span className="text-muted-foreground flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs">
              <UsersIcon className="size-3" />
              {SCHEDULE_UI.from_queue}
            </span>
          )}
          {balance && balance.debt > 0 && (
            <span className="bg-destructive/10 text-destructive rounded-full px-2.5 py-1 text-xs font-medium">
              {PAYMENT_UI.debt}: {formatSom(balance.debt)}
            </span>
          )}
          {balance && balance.debt < 0 && (
            <span className="bg-ok/15 text-ok rounded-full px-2.5 py-1 text-xs font-medium">
              {PAYMENT_UI.prepaid}: {formatSom(-balance.debt)}
            </span>
          )}
        </div>
      )}

      {!wide && item.phone && (
        <Button variant="outline" asChild>
          <a href={`tel:${item.phone.replace(/[^+\d]/g, '')}`}>
            <PhoneIcon />
            {formatUzPhone(item.phone)}
          </a>
        </Button>
      )}

      <div className="flex flex-col gap-2.5 border-t pt-3">
        <Row icon={ClockIcon} label={SCHEDULE_UI.time}>
          <span className="tabular-nums">
            {formatDate(item.at.slice(0, 10))} · {timeOf(item.at)} – {endTimeOf(item)}
          </span>
        </Row>
        <Row icon={StethoscopeIcon} label={SCHEDULE_UI.doctor}>
          {item.doctorName ?? SCHEDULE_UI.doctor_none}
        </Row>
        {wide && item.phone && (
          <Row icon={PhoneIcon} label={PATIENT_UI.phone}>
            <a href={`tel:${item.phone.replace(/[^+\d]/g, '')}`} className="text-primary">
              {formatUzPhone(item.phone)}
            </a>
          </Row>
        )}
        {item.note && (
          <Row icon={NotebookPenIcon} label={SCHEDULE_UI.note}>
            {item.note}
          </Row>
        )}
      </div>

      {canWrite && (
        <div className="border-t pt-3">
          <div className="text-muted-foreground mb-2 text-xs">{SCHEDULE_UI.status}</div>
          <div className="flex flex-wrap gap-1.5">
            {CHIPS.map((status) => {
              const active = item.status === status
              const chipTone = statusTone(status)
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => !active && actions.onStatus(item, status)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs transition-colors',
                    active
                      ? cn(chipTone.badge, 'border-transparent font-medium')
                      : status === 'cancelled'
                        ? 'text-destructive border-destructive/40 hover:bg-destructive/10'
                        : 'hover:bg-accent',
                  )}
                >
                  {/* Bekor qilish — amal; tanlangach holat nomi koʻrinadi */}
                  {status === 'cancelled' && !active
                    ? SCHEDULE_UI.cancel
                    : APPOINTMENT_STATUS_LABELS[status]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className={cn('gap-2 border-t pt-3', wide ? 'flex flex-wrap' : 'flex flex-col')}>
        {canWrite && !done && (
          <Button size={wide ? 'sm' : 'default'} onClick={() => actions.onComplete(item)}>
            <CircleCheckIcon />
            {SCHEDULE_UI.complete_submit}
          </Button>
        )}
        <div className={cn('flex gap-2', !wide && '[&>*]:flex-1')}>
          <Button variant="outline" size={wide ? 'sm' : 'default'} asChild>
            <Link to={`/patients/${item.patientId}`}>
              <UserIcon />
              {SCHEDULE_UI.open_card}
            </Link>
          </Button>
          {canWrite && (
            <Button
              variant="outline"
              size={wide ? 'sm' : 'default'}
              onClick={() => actions.onEdit(item)}
            >
              {UI_TEXT.edit}
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  if (!wide) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[85vh] overflow-y-auto rounded-t-[28px] px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetTitle className="sr-only">{item.fio}</SheetTitle>
          <div className="bg-foreground/15 mx-auto mb-3 h-1 w-10 shrink-0 rounded-full" />
          {body}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">{item.fio}</DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  )
}
