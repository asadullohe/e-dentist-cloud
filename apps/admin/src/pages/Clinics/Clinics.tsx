import { ADMIN_UI, formatDate, formatDateTime, formatUzPhone } from '@e-dentist/shared'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type ClinicSummary, useClinics } from '@/entities/clinic'
import {
  Badge,
  Card,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'

function StatusBadge({ clinic }: { clinic: ClinicSummary }) {
  if (clinic.status === 'blocked') return <Badge variant="destructive">{ADMIN_UI.blocked}</Badge>
  if (clinic.expired) return <Badge variant="destructive">{ADMIN_UI.expired}</Badge>
  if (clinic.isTrial) return <Badge variant="secondary">{ADMIN_UI.trial}</Badge>
  return <Badge variant="outline">{ADMIN_UI.active}</Badge>
}

export function Clinics() {
  const [search, setSearch] = useState('')
  const { data: clinics, isPending } = useClinics(search)

  return (
    <>
      <h1 className="font-display mb-4 text-2xl font-bold tracking-tight">{ADMIN_UI.clinics}</h1>

      <Input
        className="mb-3 max-w-sm"
        placeholder={ADMIN_UI.search}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ADMIN_UI.clinic}</TableHead>
                <TableHead className="w-28">{ADMIN_UI.staff}</TableHead>
                <TableHead className="w-36">{ADMIN_UI.expires}</TableHead>
                <TableHead className="w-44">{ADMIN_UI.last_login}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinics?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    {ADMIN_UI.empty}
                  </TableCell>
                </TableRow>
              )}
              {clinics?.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell>
                    <Link to={`/klinika/${clinic.id}`} className="font-medium hover:underline">
                      {clinic.name}
                    </Link>
                    <span className="ml-2">
                      <StatusBadge clinic={clinic} />
                    </span>
                    <div className="text-muted-foreground text-xs">
                      {clinic.phone ? formatUzPhone(clinic.phone) : '—'}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{clinic.staffCount}</TableCell>
                  <TableCell className="tabular-nums">{formatDate(clinic.expiresAt)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {clinic.lastLoginAt ? formatDateTime(clinic.lastLoginAt) : ADMIN_UI.never}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
