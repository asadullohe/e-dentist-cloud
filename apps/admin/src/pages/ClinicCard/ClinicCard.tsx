import {
  ADMIN_UI,
  AUDIT_LABELS,
  formatDate,
  formatDateTime,
  formatUzPhone,
} from '@e-dentist/shared'
import { ArrowLeftIcon, MailIcon, SendIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { StatusBadge, useClinic } from '@/entities/clinic'
import { useExtendClinic, useResendInvite, useSetClinicStatus } from '@/features/clinic-actions'
import { ClinicLogoCard } from '@/features/clinic-logo'
import {
  Badge,
  Button,
  Card,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'

/// Qoʻlda toʻlov: mijoz Telegram orqali yozadi, admin shu tugmalarni
/// bosadi (tz.md 8-boʻlim)
const EXTEND_OPTIONS = [30, 90, 365]

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="gap-0 p-4">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </Card>
  )
}

export function ClinicCard() {
  const { id = '' } = useParams()
  const { data: clinic, isPending } = useClinic(id)
  const { mutate: extend, isPending: isExtending } = useExtendClinic()
  const { mutate: setStatus, isPending: isBlocking } = useSetClinicStatus()
  const { mutate: resendInvite, isPending: isResending } = useResendInvite()

  if (isPending || !clinic) return <Skeleton className="h-64 w-full" />

  const blocked = clinic.status === 'blocked'

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          {ADMIN_UI.back}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{clinic.name}</h2>
            <p className="text-sm text-muted-foreground">
              {clinic.phone ? formatUzPhone(clinic.phone) : '—'} · {ADMIN_UI.created}:{' '}
              {formatDateTime(clinic.createdAt)} · {clinic.plan}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge clinic={clinic} />
            <Badge variant="outline">
              {clinic.queueEnabled ? ADMIN_UI.queue_on : ADMIN_UI.queue_off}
            </Badge>
          </div>
        </div>
      </div>

      {clinic.pendingInvite && (
        <Card className="gap-0 border-info/40 bg-info/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-medium">
                <MailIcon className="size-4" />
                {ADMIN_UI.invite_pending}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {clinic.pendingInvite.email} ·{' '}
                {ADMIN_UI.invite_sent_at(formatDateTime(clinic.pendingInvite.sentAt))}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isResending}
              onClick={() => resendInvite(clinic.id)}
            >
              <SendIcon />
              {ADMIN_UI.invite_resend}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={ADMIN_UI.expires} value={formatDate(clinic.expiresAt)} />
        <Stat label={ADMIN_UI.staff} value={clinic.staffCount} />
        <Stat label={ADMIN_UI.patients_count} value={clinic.patientCount} />
        <Stat label={ADMIN_UI.visits_count} value={clinic.visitCount} />
      </div>

      <Card className="flex-row flex-wrap items-center gap-2 p-4">
        <span className="text-sm font-medium">{ADMIN_UI.extend}:</span>
        {EXTEND_OPTIONS.map((days) => (
          <Button
            key={days}
            size="sm"
            variant="outline"
            disabled={isExtending}
            onClick={() => extend({ id: clinic.id, days })}
          >
            {ADMIN_UI.extend_days(days)}
          </Button>
        ))}
        <div className="flex-1" />
        <Button
          size="sm"
          variant={blocked ? 'outline' : 'destructive'}
          disabled={isBlocking}
          onClick={() => setStatus({ id: clinic.id, status: blocked ? 'active' : 'blocked' })}
        >
          {blocked ? ADMIN_UI.unblock : ADMIN_UI.block}
        </Button>
      </Card>

      <ClinicLogoCard clinic={clinic} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden py-0">
          <h3 className="px-4 pt-4 pb-2 font-semibold">{ADMIN_UI.staff}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ADMIN_UI.staff_member}</TableHead>
                <TableHead className="w-32">{ADMIN_UI.last_login}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinic.staff.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2 font-medium">
                      {person.fullName ?? person.email}
                      {person.status === 'disabled' && (
                        <Badge variant="outline">{ADMIN_UI.blocked}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {person.email} · {person.roleName ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {person.lastLoginAt ? formatDateTime(person.lastLoginAt) : ADMIN_UI.never}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="overflow-hidden py-0">
          <h3 className="px-4 pt-4 pb-2 font-semibold">{ADMIN_UI.history}</h3>
          <ul className="divide-y">
            {clinic.history.map((row) => (
              <li key={`${row.at}-${row.action}`} className="px-4 py-2.5 text-sm">
                <span className="mr-2 text-xs text-muted-foreground tabular-nums">
                  {formatDateTime(row.at)}
                </span>
                {AUDIT_LABELS[row.action as keyof typeof AUDIT_LABELS] ?? row.action}
                {row.actor && <span className="text-xs text-muted-foreground"> · {row.actor}</span>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
