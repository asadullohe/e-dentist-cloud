import { ADMIN_UI, AUDIT_LABELS, formatDateTime, formatMonth } from '@e-dentist/shared'
import { useState } from 'react'
import { useEvents, useStats } from '@/entities/stats'
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
    </Card>
  )
}

export function Stats() {
  const [all, setAll] = useState(false)
  const { data: stats, isPending } = useStats()
  const { data: events } = useEvents(all)

  if (isPending || !stats) return <Skeleton className="h-64 w-full" />

  return (
    <>
      <h1 className="font-display mb-4 text-2xl font-bold tracking-tight">{ADMIN_UI.stats}</h1>

      <div className="mb-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={ADMIN_UI.total} value={stats.total} />
        <Stat label={ADMIN_UI.active_clinics} value={stats.active} />
        <Stat label={ADMIN_UI.trial_clinics} value={stats.trial} />
        <Stat label={ADMIN_UI.expired_clinics} value={stats.expired} />
        <Stat label={ADMIN_UI.blocked_clinics} value={stats.blocked} />
        <Stat label={ADMIN_UI.staff_total} value={stats.staff} />
      </div>

      <Card className="mb-4 overflow-hidden py-0">
        <h2 className="font-display px-4 pt-4 pb-2 font-semibold">{ADMIN_UI.monthly}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{ADMIN_UI.monthly}</TableHead>
              <TableHead className="w-40 text-right">{ADMIN_UI.registered_month}</TableHead>
              <TableHead className="w-40 text-right">{ADMIN_UI.extended_month}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.months.map((row) => (
              <TableRow key={row.month}>
                <TableCell>{formatMonth(row.month)}</TableCell>
                <TableCell className="text-right tabular-nums">{row.registered}</TableCell>
                <TableCell className="text-right tabular-nums">{row.extended}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-muted-foreground px-4 pb-3 text-xs">{ADMIN_UI.revenue_pending}</p>
      </Card>

      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-display font-semibold">{ADMIN_UI.events}</h2>
        <Button variant="outline" size="sm" onClick={() => setAll(!all)}>
          {all ? ADMIN_UI.events_platform : ADMIN_UI.events_all}
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">{ADMIN_UI.event_time}</TableHead>
              <TableHead>{ADMIN_UI.event_action}</TableHead>
              <TableHead className="w-64">{ADMIN_UI.clinic}</TableHead>
              <TableHead className="w-56">{ADMIN_UI.event_who}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events?.map((event) => (
              <TableRow key={`${event.at}-${event.action}-${event.clinicName}`}>
                <TableCell className="text-muted-foreground text-xs tabular-nums">
                  {formatDateTime(event.at)}
                </TableCell>
                <TableCell>
                  {event.action === 'login_failed' ? (
                    <Badge variant="destructive">
                      {AUDIT_LABELS[event.action as keyof typeof AUDIT_LABELS]}
                    </Badge>
                  ) : (
                    (AUDIT_LABELS[event.action as keyof typeof AUDIT_LABELS] ?? event.action)
                  )}
                </TableCell>
                <TableCell className="truncate">{event.clinicName}</TableCell>
                <TableCell className="text-muted-foreground truncate text-xs">
                  {event.actor ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
