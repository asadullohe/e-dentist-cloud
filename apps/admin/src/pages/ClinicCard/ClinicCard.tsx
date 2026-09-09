import {
  ADMIN_UI,
  AUDIT_LABELS,
  formatDate,
  formatDateTime,
  formatUzPhone,
} from '@e-dentist/shared'
import { ArrowLeftIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useClinic } from '@/entities/clinic'
import { useExtendClinic, useSetClinicStatus } from '@/features/clinic-actions'
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
    <Card className="gap-1 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-display text-xl font-bold tabular-nums">{value}</div>
    </Card>
  )
}

export function ClinicCard() {
  const { id = '' } = useParams()
  const { data: clinic, isPending } = useClinic(id)
  const { mutate: extend, isPending: isExtending } = useExtendClinic()
  const { mutate: setStatus, isPending: isBlocking } = useSetClinicStatus()

  if (isPending || !clinic) return <Skeleton className="h-64 w-full" />

  const blocked = clinic.status === 'blocked'

  return (
    <>
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeftIcon className="size-4" />
        {ADMIN_UI.back}
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{clinic.name}</h1>
          <p className="text-muted-foreground text-sm">
            {clinic.phone ? formatUzPhone(clinic.phone) : '—'} · {ADMIN_UI.created}:{' '}
            {formatDateTime(clinic.createdAt)} · {clinic.plan}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {blocked && <Badge variant="destructive">{ADMIN_UI.blocked}</Badge>}
          {clinic.isTrial && <Badge variant="secondary">{ADMIN_UI.trial}</Badge>}
          <Badge variant="outline">
            {clinic.queueEnabled ? ADMIN_UI.queue_on : ADMIN_UI.queue_off}
          </Badge>
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <Stat label={ADMIN_UI.expires} value={formatDate(clinic.expiresAt)} />
        <Stat label={ADMIN_UI.staff} value={clinic.staffCount} />
        <Stat label={ADMIN_UI.patients_count} value={clinic.patientCount} />
        <Stat label={ADMIN_UI.visits_count} value={clinic.visitCount} />
      </div>

      <Card className="mb-4 flex-row flex-wrap items-center gap-2 p-3">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden py-0">
          <h2 className="font-display px-4 pt-4 pb-2 font-semibold">{ADMIN_UI.staff}</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ADMIN_UI.clinic}</TableHead>
                <TableHead className="w-32">{ADMIN_UI.last_login}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinic.staff.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="font-medium">
                      {person.fullName ?? person.email}
                      {person.status === 'disabled' && (
                        <Badge variant="outline" className="ml-2">
                          {ADMIN_UI.blocked}
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {person.email} · {person.roleName ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {person.lastLoginAt ? formatDateTime(person.lastLoginAt) : ADMIN_UI.never}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="overflow-hidden py-0">
          <h2 className="font-display px-4 pt-4 pb-2 font-semibold">{ADMIN_UI.history}</h2>
          <ul className="divide-y">
            {clinic.history.map((row) => (
              <li key={`${row.at}-${row.action}`} className="px-4 py-2 text-sm">
                <span className="text-muted-foreground mr-2 text-xs tabular-nums">
                  {formatDateTime(row.at)}
                </span>
                {AUDIT_LABELS[row.action as keyof typeof AUDIT_LABELS] ?? row.action}
                {row.actor && <span className="text-muted-foreground text-xs"> · {row.actor}</span>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
