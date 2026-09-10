import { ADMIN_UI, AUDIT_LABELS, formatDateTime } from '@e-dentist/shared'
import type { LucideIcon } from 'lucide-react'
import {
  ActivityIcon,
  BanIcon,
  BuildingIcon,
  CircleCheckIcon,
  ClockIcon,
  UsersIcon,
} from 'lucide-react'
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
import { MonthsChart } from './MonthsChart'

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </Card>
  )
}

export function Stats() {
  const [all, setAll] = useState(false)
  const { data: stats, isPending } = useStats()
  const { data: events } = useEvents(all)

  if (isPending || !stats) return <Skeleton className="h-64 w-full" />

  const tiles = [
    { label: ADMIN_UI.total, value: stats.total, icon: BuildingIcon },
    { label: ADMIN_UI.active_clinics, value: stats.active, icon: CircleCheckIcon },
    { label: ADMIN_UI.trial_clinics, value: stats.trial, icon: ClockIcon },
    { label: ADMIN_UI.expired_clinics, value: stats.expired, icon: ActivityIcon },
    { label: ADMIN_UI.blocked_clinics, value: stats.blocked, icon: BanIcon },
    { label: ADMIN_UI.staff_total, value: stats.staff, icon: UsersIcon },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{ADMIN_UI.stats}</h2>
        <p className="text-sm text-muted-foreground">{ADMIN_UI.stats_hint}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {tiles.map((tile) => (
          <Stat key={tile.label} {...tile} />
        ))}
      </div>

      <Card className="gap-0 p-4">
        <div className="mb-4">
          <h3 className="font-semibold">{ADMIN_UI.monthly}</h3>
          <p className="text-xs text-muted-foreground">{ADMIN_UI.monthly_hint}</p>
        </div>
        <MonthsChart months={stats.months} />
        <p className="mt-3 text-xs text-muted-foreground">{ADMIN_UI.revenue_pending}</p>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-semibold">{ADMIN_UI.events}</h3>
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
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
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
                  <TableCell className="truncate text-xs text-muted-foreground">
                    {event.actor ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
