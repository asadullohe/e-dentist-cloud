import { ADMIN_UI, formatDate, formatDateTime, formatUzPhone } from '@e-dentist/shared'
import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge, useClinics } from '@/entities/clinic'
import { ClinicCreateDialog } from '@/features/clinic-create'
import {
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

export function Clinics() {
  const [search, setSearch] = useState('')
  const { data: clinics, isPending } = useClinics(search)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{ADMIN_UI.clinics}</h2>
          <p className="text-sm text-muted-foreground">{ADMIN_UI.clinics_hint}</p>
        </div>
        <ClinicCreateDialog />
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={ADMIN_UI.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ADMIN_UI.clinic}</TableHead>
                <TableHead className="w-28 text-right">{ADMIN_UI.staff}</TableHead>
                <TableHead className="w-36">{ADMIN_UI.expires}</TableHead>
                <TableHead className="w-44">{ADMIN_UI.last_login}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinics?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    {ADMIN_UI.empty}
                  </TableCell>
                </TableRow>
              )}
              {clinics?.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/klinika/${clinic.id}`} className="font-medium hover:underline">
                        {clinic.name}
                      </Link>
                      <StatusBadge clinic={clinic} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {clinic.phone ? formatUzPhone(clinic.phone) : '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{clinic.staffCount}</TableCell>
                  <TableCell className="tabular-nums">{formatDate(clinic.expiresAt)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {clinic.lastLoginAt ? formatDateTime(clinic.lastLoginAt) : ADMIN_UI.never}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
