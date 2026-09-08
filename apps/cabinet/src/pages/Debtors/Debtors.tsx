import { DEBTORS_UI, formatSom, formatUzPhone, PAYMENT_UI } from '@e-dentist/shared'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDebtors } from '@/entities/debtor'
import {
  Button,
  Card,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'

export function Debtors() {
  const [page, setPage] = useState(1)
  const { data, isPending } = useDebtors(page)

  const pageCount = data ? Math.ceil(data.total / data.pageSize) : 0

  return (
    <>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{DEBTORS_UI.title}</h1>
        {data && data.total > 0 && (
          <div className="text-muted-foreground text-sm">
            {DEBTORS_UI.count(data.total)} ·{' '}
            <span className="text-destructive font-semibold">
              {DEBTORS_UI.total}: {formatSom(data.totalDebt)}
            </span>
          </div>
        )}
      </div>

      <Card className="overflow-hidden py-0">
        {isPending ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : data?.items.length === 0 ? (
          <EmptyState icon="🎉" text={DEBTORS_UI.empty} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{DEBTORS_UI.patient}</TableHead>
                <TableHead className="hidden w-44 sm:table-cell">{DEBTORS_UI.phone}</TableHead>
                <TableHead className="hidden w-36 text-right lg:table-cell">
                  {PAYMENT_UI.charges}
                </TableHead>
                <TableHead className="hidden w-36 text-right lg:table-cell">
                  {PAYMENT_UI.paid}
                </TableHead>
                <TableHead className="w-36 text-right">{PAYMENT_UI.debt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((debtor) => (
                <TableRow key={debtor.patientId}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/patients/${debtor.patientId}`}
                      className="hover:text-primary hover:underline"
                    >
                      {debtor.fio}
                    </Link>
                    {debtor.phone && (
                      <span className="text-muted-foreground block text-xs sm:hidden">
                        {formatUzPhone(debtor.phone)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {debtor.phone ? formatUzPhone(debtor.phone) : '—'}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {formatSom(debtor.charges)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {formatSom(debtor.paid)}
                  </TableCell>
                  <TableCell className="text-destructive text-right font-semibold tabular-nums">
                    {formatSom(debtor.debt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ‹
          </Button>
          <span className="text-muted-foreground text-sm tabular-nums">
            {page} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            ›
          </Button>
        </div>
      )}
    </>
  )
}
